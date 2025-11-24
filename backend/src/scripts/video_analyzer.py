import os
import sys
import json
import argparse
import re
import subprocess
import logging
import tempfile
import urllib.request
import urllib.parse

def download_http_to_temp(http_url):
    """下载HTTP URL到临时文件，返回本地路径"""
    if not http_url.startswith(('http://', 'https://')):
        return http_url  # 不是HTTP URL，直接返回

    try:
        # 创建临时文件
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_file:
            temp_path = temp_file.name

        logging.info(f"正在下载视频文件: {http_url}")
        urllib.request.urlretrieve(http_url, temp_path)
        logging.info(f"视频文件下载完成: {temp_path}")
        return temp_path
    except Exception as e:
        logging.error(f"下载视频文件失败: {e}")
        return http_url  # 下载失败，返回原URL

def to_file_url(p):
    p = os.path.abspath(p)
    if re.match(r'^[a-zA-Z]:\\', p):
        return 'file://' + p.replace('\\', '/')
    return 'file://' + p

def get_duration_with_ffprobe(video_path):
    """使用ffprobe获取视频持续时间"""
    try:
        cmd = [
            'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
            '-of', 'csv=p=0', video_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        if result.returncode == 0 and result.stdout.strip():
            duration = float(result.stdout.strip())
            return duration if duration > 0 else None
    except (subprocess.TimeoutExpired, subprocess.SubprocessError, ValueError, FileNotFoundError):
        pass
    return None

def get_duration_with_opencv_method2(video_path):
    """使用OpenCV的备选方法获取持续时间"""
    try:
        import cv2
        cap = cv2.VideoCapture(video_path)
        if cap.isOpened():
            # 方法2：使用CAP_PROP_POS_MSEC计算
            cap.set(cv2.CAP_PROP_POS_AVI_RATIO, 1.0)
            duration_ms = cap.get(cv2.CAP_PROP_POS_MSEC)
            cap.release()
            if duration_ms and duration_ms > 0:
                return duration_ms / 1000.0  # 转换为秒
    except Exception:
        pass
    return None

def read_video_meta(local_path):
    """读取视频元数据，使用多种方法确保准确性"""
    meta = {
        "duration": 0,
        "frameRate": None,
        "width": None,
        "height": None,
        "frames": None,
        "diagnostics": {
            "opencv_success": False,
            "ffprobe_success": False,
            "opencv_method2_success": False,
            "file_exists": os.path.exists(local_path),
            "file_size": 0,
            "errors": []
        }
    }

    # 检查文件基本信息
    if meta["diagnostics"]["file_exists"]:
        try:
            meta["diagnostics"]["file_size"] = os.path.getsize(local_path)
        except Exception:
            meta["diagnostics"]["errors"].append("无法获取文件大小")
    else:
        meta["diagnostics"]["errors"].append("文件不存在")
        return meta

    # 方法1：使用ffprobe（最可靠）
    ffprobe_duration = get_duration_with_ffprobe(local_path)
    if ffprobe_duration:
        meta["duration"] = round(ffprobe_duration, 2)
        meta["diagnostics"]["ffprobe_success"] = True
        logging.info(f"ffprobe成功获取duration: {meta['duration']}秒")

    # 方法2：使用OpenCV主要方法
    try:
        import cv2
        cap = cv2.VideoCapture(local_path)
        if cap.isOpened():
            meta["diagnostics"]["opencv_success"] = True

            fps = cap.get(cv2.CAP_PROP_FPS)
            total = cap.get(cv2.CAP_PROP_FRAME_COUNT)
            w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

            meta["frameRate"] = float(fps) if fps and fps > 0 else None
            meta["frames"] = int(total) if total and total > 0 else None
            meta["width"] = w if w > 0 else None
            meta["height"] = h if h > 0 else None

            # 计算duration（如果ffprobe失败）
            if not meta["diagnostics"]["ffprobe_success"] and meta["frameRate"] and meta["frames"]:
                calculated_duration = round(meta["frames"] / meta["frameRate"], 2)
                if calculated_duration > 0:
                    meta["duration"] = calculated_duration
                    logging.info(f"OpenCV主要方法计算duration: {meta['duration']}秒")

            cap.release()
        else:
            meta["diagnostics"]["errors"].append("OpenCV无法打开视频文件")
    except Exception as e:
        meta["diagnostics"]["errors"].append(f"OpenCV处理错误: {str(e)}")

    # 方法3：OpenCV备选方法（如果前面都失败）
    if meta["duration"] == 0:
        opencv2_duration = get_duration_with_opencv_method2(local_path)
        if opencv2_duration:
            meta["duration"] = round(opencv2_duration, 2)
            meta["diagnostics"]["opencv_method2_success"] = True
            logging.info(f"OpenCV备选方法获取duration: {meta['duration']}秒")

    # 如果所有方法都失败，记录详细错误信息
    if meta["duration"] == 0:
        meta["diagnostics"]["errors"].append("所有方法都无法获取视频持续时间")
        logging.error(f"无法获取视频duration: {local_path}")
        logging.error(f"诊断信息: {meta['diagnostics']}")

    return meta

def call_dashscope(video_path_url, prompt, fps):
    try:
        import dashscope
        from dashscope import MultiModalConversation
        api_key = os.getenv('DASHSCOPE_API_KEY')
        messages = [
            {
                "role": "user",
                "content": [
                    {"video": video_path_url, "fps": fps},
                    {"text": prompt}
                ]
            }
        ]
        resp = MultiModalConversation.call(
            api_key=api_key,
            model='qwen3-vl-plus',
            messages=messages
        )
        usage = {
            "input_tokens": getattr(getattr(resp, 'usage', None), 'input_tokens', None),
            "output_tokens": getattr(getattr(resp, 'usage', None), 'output_tokens', None)
        }
        out = None
        try:
            parts = resp.output.choices[0].message.content
            if isinstance(parts, list) and len(parts) > 0 and isinstance(parts[0], dict):
                text = parts[0].get("text")
                if text:
                    out = text
        except Exception:
            out = None
        data = None
        if out:
            s = out.strip()
            try:
                data = json.loads(s)
            except Exception:
                m = re.search(r'\{[\s\S]*\}', s)
                if m:
                    try:
                        data = json.loads(m.group(0))
                    except Exception:
                        data = None
        return data, usage
    except Exception as e:
        return {"error": str(e)}, None

def build_result(meta, ai):
    """构建分析结果，优先使用AI分析结果，fallback到元数据，包含诊断信息"""
    base = {
        "duration": meta.get("duration", 0),
        "frameRate": meta.get("frameRate"),
        "resolution": f"{meta.get('width')}x{meta.get('height')}" if meta.get('width') and meta.get('height') else None,
        "frames": meta.get("frames"),
        "keyframeCount": 0,
        "sceneCount": 0,
        "objectCount": 0,
        "actionCount": 0,
        "keyframes": [],
        "scenes": [],
        "objects": [],
        "actions": [],
        "diagnostics": meta.get("diagnostics", {})
    }

    # 如果AI分析成功，使用AI的结果
    if isinstance(ai, dict) and not ai.get("error"):
        for k in ["duration", "frameRate", "resolution", "frames", "keyframeCount", "sceneCount", "objectCount", "actionCount", "keyframes", "scenes", "objects", "actions", "vlAnalysis", "finalReport", "structuredData"]:
            if k in ai and ai[k] is not None:
                # 对于duration，只有在AI提供了有效值时才覆盖
                if k == "duration" and isinstance(ai[k], (int, float)) and ai[k] > 0:
                    base[k] = ai[k]
                elif k != "duration":
                    base[k] = ai[k]

    # 确保基本信息的一致性
    if base["duration"] == 0 and meta.get("duration", 0) > 0:
        base["duration"] = meta["duration"]

    # 添加验证状态信息
    if meta.get("diagnostics", {}).get("duration") == 0:
        base["validation_status"] = "failed"
        base["error_message"] = "无法获取视频持续时间，请检查视频文件是否完整或格式是否支持"
    else:
        base["validation_status"] = "success"
        base["error_message"] = None

    return base

def main():
    # 配置日志
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stderr)
        ]
    )

    parser = argparse.ArgumentParser()
    parser.add_argument('--video-path', required=True)
    parser.add_argument('--type', default='content')
    parser.add_argument('--fps', type=float, default=2.0)
    parser.add_argument('--prompt', default='请以JSON格式输出：{"duration":秒数,"frameRate":帧率,"resolution":"WxH","frames":总帧数,"keyframeCount":数量,"sceneCount":数量,"objectCount":数量,"actionCount":数量,"keyframes":[],"scenes":[],"objects":[],"actions":[],"vlAnalysis":{},"finalReport":{},"structuredData":{}}')
    args = parser.parse_args()

    input_path = args.video_path
    logging.info(f"开始分析视频文件: {input_path}")

    # 如果是HTTP URL，下载到临时文件
    local_path = download_http_to_temp(input_path)
    is_temp_file = local_path != input_path

    try:
        meta = read_video_meta(local_path)
        logging.info(f"视频元数据: duration={meta['duration']}, frameRate={meta['frameRate']}, resolution={meta['width']}x{meta['height']}")

        url = to_file_url(local_path)
        ai, usage = call_dashscope(url, args.prompt, args.fps)

        if isinstance(ai, dict) and ai.get("error"):
            logging.error(f"AI分析失败: {ai['error']}")
        else:
            logging.info("AI分析成功")

        result = build_result(meta, ai)
        logging.info(f"最终结果duration: {result['duration']}, 验证状态: {result.get('validation_status')}")

        o = {
            "success": True,
            "data": {
                "rawAnalysis": result,
                "finalReport": ai.get("finalReport") if isinstance(ai, dict) else None,
                "structuredData": ai.get("structuredData") if isinstance(ai, dict) else None
            },
            "usage": usage
        }
        print(json.dumps(o, ensure_ascii=False))

    finally:
        # 清理临时文件
        if is_temp_file and os.path.exists(local_path):
            try:
                os.unlink(local_path)
                logging.info(f"已清理临时文件: {local_path}")
            except Exception as e:
                logging.warning(f"清理临时文件失败: {e}")

if __name__ == '__main__':
    main()