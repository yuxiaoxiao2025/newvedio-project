#!/usr/bin/env python3
"""
DashScope VL 视频分析服务
使用DashScope Python SDK处理本地视频文件
"""

import os
import sys
import json
import argparse
import subprocess
from pathlib import Path

try:
    import dashscope
    from dashscope import MultiModalConversation
except ImportError:
    print(json.dumps({
        "success": False,
        "error": "DashScope SDK未安装，请运行: pip install dashscope"
    }))
    sys.exit(1)

def load_env():
    """加载环境变量"""
    # 脚本在scripts目录中，.env文件在backend目录中
    env_file = Path(__file__).parent.parent / ".env"
    if env_file.exists():
        # 读取.env文件并设置环境变量
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    # 移除值两端的引号
                    value = value.strip()
                    if value.startswith('"') and value.endswith('"'):
                        value = value[1:-1]
                    elif value.startswith("'") and value.endswith("'"):
                        value = value[1:-1]
                    os.environ[key.strip()] = value

def analyze_video_with_sdk(video_path, analysis_type="content", extra_prompt="", video_path2=""):
    """
    使用DashScope Python SDK分析本地视频文件

    Args:
        video_path: 视频文件的本地路径
        analysis_type: 分析类型 (content/fusion)
        extra_prompt: 额外的提示词
        video_path2: 第二个视频文件路径（仅用于融合分析）

    Returns:
        分析结果JSON字符串
    """
    try:
        # 设置API密钥
        api_key = os.getenv('DASHSCOPE_API_KEY')
        if not api_key:
            return json.dumps({
                "success": False,
                "error": "未设置DASHSCOPE_API_KEY环境变量"
            })

        dashscope.api_key = api_key

        # 确保视频文件存在 - 使用更robust的检查方法
        print(f"[DEBUG] 检查文件路径: {video_path}", file=sys.stderr)
        print(f"[DEBUG] 当前工作目录: {os.getcwd()}", file=sys.stderr)
        print(f"[DEBUG] 文件存在性: {os.path.exists(video_path)}", file=sys.stderr)

        if not os.path.exists(video_path):
            # 尝试使用绝对路径
            abs_path = os.path.abspath(video_path)
            print(f"[DEBUG] 尝试绝对路径: {abs_path}", file=sys.stderr)
            print(f"[DEBUG] 绝对路径存在性: {os.path.exists(abs_path)}", file=sys.stderr)

            if os.path.exists(abs_path):
                video_path = abs_path
                print(f"[DEBUG] 使用绝对路径: {video_path}", file=sys.stderr)
            else:
                return json.dumps({
                    "success": False,
                    "error": f"视频文件不存在: {video_path} (尝试绝对路径: {abs_path})"
                })

        # 检查文件大小，决定使用Base64还是file://协议
        try:
            file_size = os.path.getsize(video_path)
            print(f"[DEBUG] 文件大小获取成功: {file_size} 字节", file=sys.stderr)
        except OSError as e:
            return json.dumps({
                "success": False,
                "error": f"无法获取视频文件大小: {video_path}, 错误: {str(e)}"
            })
        print(f"视频文件大小: {file_size} 字节 ({file_size/1024/1024:.2f} MB)", file=sys.stderr)

        # 如果文件小于10MB，使用Base64编码
        if file_size < 10 * 1024 * 1024:  # 10MB
            print("使用Base64编码方式传输视频", file=sys.stderr)
            import base64

            with open(video_path, 'rb') as f:
                video_data = f.read()

            base64_data = base64.b64encode(video_data).decode('utf-8')
            video_content = {
                "video": f"data:video/mp4;base64,{base64_data}"
            }
            print(f"Base64编码长度: {len(base64_data)} 字符", file=sys.stderr)
        else:
            print("使用file://协议传输视频", file=sys.stderr)
            # 获取视频文件的绝对路径并格式化为file:// URL
            abs_path = os.path.abspath(video_path)
            # Windows系统需要额外处理 - 使用标准的file:///D:/path格式
            if sys.platform == 'win32':
                file_url = f"file:///{abs_path.replace('\\', '/')}"
            else:
                file_url = f"file://{abs_path}"

            video_content = {
                "video": file_url,
                "fps": 2  # 每2秒抽取一帧
            }

            print(f"分析视频文件: {file_url}", file=sys.stderr)

        # 根据分析类型选择提示词
        if analysis_type == "content":
            system_prompt = "你是一名专业的视频分析师，具有深厚的视觉分析和内容解读能力。请用JSON格式返回分析结果。"
            user_prompt = f"""请分析这个视频文件，提供详细的内容分析。

请按以下JSON格式输出结果：
{{
  "duration": 视频时长（秒），
  "resolution": "视频分辨率",
  "frameRate": 帧率,
  "keyframes": [
    {{
      "timestamp": 时间戳（秒）,
      "description": "该时间点的画面描述",
      "importance": "重要程度（high/medium/low）"
    }}
  ],
  "scenes": [
    {{
      "type": "场景类型",
      "startTime": 开始时间,
      "endTime": 结束时间,
      "description": "场景描述",
      "atmosphere": "氛围描述"
    }}
  ],
  "objects": [
    {{
      "name": "物体或人物名称",
      "confidence": 置信度（0-1）,
      "first_seen": 首次出现时间,
      "duration": 出现时长
    }}
  ],
  "actions": [
    {{
      "action": "动作描述",
      "startTime": 开始时间,
      "endTime": 结束时间,
      "participants": "参与对象"
    }}
  ],
  "visual_analysis": {{
    "color_palette": ["主要色彩"],
    "lighting": "光线状况描述",
    "composition": "构图特点",
    "movement": "运动特征"
  }},
  "quality_assessment": {{
    "sharpness": 清晰度评分（1-10）,
    "stability": 稳定性评分（1-10）,
    "exposure": 曝光评估,
    "overall_quality": 整体质量评分（1-10）
  }},
  "emotional_tone": "情感基调描述",
  "content_summary": "视频内容概要"
}}

{extra_prompt}"""
        elif analysis_type == "fusion":
            system_prompt = "你是一名专业的视频融合分析师，擅长分析两个视频的融合潜力。请用JSON格式返回分析结果。"
            user_prompt = f"""请分析这两个视频文件，提供详细的融合分析方案。

请按以下JSON格式输出结果：
{{
  "fusion_potential": {{
    "compatibility_score": 融合兼容性评分（0-10）,
    "style_match": 风格匹配度描述",
    "transition_feasibility": 转场可行性评估"
  }},
  "recommended_structure": [
    {{
      "segment": "段落描述",
      "source_video": "来源视频（video1/video2/mixed）",
      "start_time": 开始时间,
      "end_time": 结束时间,
      "transition": "转场方式",
      "rationale": "选择理由"
    }}
  ],
  "technical_considerations": {{
    "resolution_match": "分辨率匹配情况",
    "color_grading": "色彩调整建议",
    "pacing_analysis": "节奏分析",
    "audio_considerations": "音频处理建议"
  }},
  "creative_suggestions": [
    {{
      "technique": "创意技巧",
      "application": "应用方式",
      "impact": "预期效果"
    }}
  ],
  "estimated_timeline": "预期制作时间线",
  "success_indicators": ["成功指标"]
}}

{extra_prompt}"""
        else:
            return json.dumps({
                "success": False,
                "error": f"不支持的分析类型: {analysis_type}"
            })

        # 构建消息内容
        content = []

        # 添加第一个视频
        content.append(video_content)

        # 如果是融合分析且有第二个视频，添加第二个视频
        if analysis_type == "fusion" and video_path2:
            # 确保第二个视频文件存在
            if not os.path.exists(video_path2):
                return json.dumps({
                    "success": False,
                    "error": f"第二个视频文件不存在: {video_path2}"
                })

            # 检查第二个视频文件大小，决定使用Base64还是file://协议
            file_size2 = os.path.getsize(video_path2)
            print(f"第二个视频文件大小: {file_size2} 字节 ({file_size2/1024/1024:.2f} MB)", file=sys.stderr)

            # 如果第二个文件小于10MB，使用Base64编码
            if file_size2 < 10 * 1024 * 1024:  # 10MB
                print("使用Base64编码方式传输第二个视频", file=sys.stderr)
                import base64

                with open(video_path2, 'rb') as f:
                    video_data2 = f.read()

                base64_data2 = base64.b64encode(video_data2).decode('utf-8')
                content.append({
                    "video": f"data:video/mp4;base64,{base64_data2}"
                })
                print(f"第二个视频Base64编码长度: {len(base64_data2)} 字符", file=sys.stderr)
            else:
                print("使用file://协议传输第二个视频", file=sys.stderr)
                # 获取第二个视频文件的绝对路径并格式化为file:// URL
                abs_path2 = os.path.abspath(video_path2)
                if sys.platform == 'win32':
                    file_url2 = f"file:///{abs_path2.replace('\\', '/')}"
                else:
                    file_url2 = f"file://{abs_path2}"

                content.append({
                    "video": file_url2,
                    "fps": 2  # 每2秒抽取一帧
                })

        # 添加文本提示
        content.append({
            "text": user_prompt
        })

        # 构建消息
        messages = [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": content
            }
        ]

        # 调用DashScope API
        response = MultiModalConversation.call(
            model='qwen3-vl-plus',
            messages=messages,
            result_format='message',
            max_tokens=4000,
            temperature=0.2
        )

        if response.status_code == 200:
            # 根据文档，message格式下的响应结构
            content = response.output.choices[0].message.content

            # 如果是数组格式，提取text内容
            if isinstance(content, list):
                content = content[0].get("text", "")
            elif isinstance(content, dict):
                content = content.get("text", "")

            # 确保content是字符串
            if not isinstance(content, str):
                content = str(content)

            # 尝试解析JSON格式的结果
            try:
                # 清理可能的markdown格式
                if content.startswith('```json'):
                    content = content[7:]
                if content.endswith('```'):
                    content = content[:-3]
                content = content.strip()

                analysis_result = json.loads(content)

                return json.dumps({
                    "success": True,
                    "data": analysis_result,
                    "raw_content": content,
                    "usage": {
                        "input_tokens": response.usage.input_tokens if hasattr(response, 'usage') else None,
                        "output_tokens": response.usage.output_tokens if hasattr(response, 'usage') else None
                    }
                })
            except json.JSONDecodeError as e:
                # 如果无法解析JSON，返回原始文本
                return json.dumps({
                    "success": True,
                    "data": {
                        "analysis_text": content,
                        "structured": False
                    },
                    "raw_content": content,
                    "parsing_error": str(e)
                })
        else:
            return json.dumps({
                "success": False,
                "error": f"API调用失败: {response.message}",
                "code": response.code,
                "request_id": response.request_id
            })

    except Exception as e:
        return json.dumps({
            "success": False,
            "error": f"分析过程中发生错误: {str(e)}",
            "type": type(e).__name__
        })

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='DashScope VL 视频分析服务')
    parser.add_argument('--video-path', required=True, help='视频文件路径')
    parser.add_argument('--video-path2', default='', help='第二个视频文件路径（仅用于融合分析）')
    parser.add_argument('--type', default='content', choices=['content', 'fusion'], help='分析类型')
    parser.add_argument('--prompt', default='', help='额外提示词')
    parser.add_argument('--debug', action='store_true', help='启用调试模式')

    args = parser.parse_args()

    # 加载环境变量
    load_env()

    # 调试模式
    if args.debug:
        api_key = os.getenv('DASHSCOPE_API_KEY')
        print(f"调试信息: API Key是否存在: {bool(api_key)}")
        if api_key:
            print(f"调试信息: API Key长度: {len(api_key)}")
            print(f"调试信息: API Key前缀: {api_key[:10]}...")
        print(f"调试信息: 视频文件路径: {args.video_path}")
        print(f"调试信息: 视频文件是否存在: {os.path.exists(args.video_path)}")

    # 执行分析
    result = analyze_video_with_sdk(args.video_path, args.type, args.prompt, args.video_path2)

    # 输出结果
    print(result)

if __name__ == "__main__":
    main()