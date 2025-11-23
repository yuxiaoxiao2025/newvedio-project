#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
视频文件诊断工具
测试test-videos目录中的所有视频文件的元数据提取能力
"""

import os
import sys
import json
import argparse
import logging
from pathlib import Path

# 添加src目录到Python路径
current_dir = Path(__file__).parent
src_dir = current_dir.parent / 'src' / 'scripts'
sys.path.insert(0, str(src_dir))

try:
    from video_analyzer import read_video_meta, get_duration_with_ffprobe
except ImportError as e:
    print(f"错误：无法导入video_analyzer模块: {e}")
    print("请确保video_analyzer.py文件存在于正确的位置")
    sys.exit(1)

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('video_diagnosis.log', encoding='utf-8')
    ]
)

def diagnose_video_file(video_path):
    """诊断单个视频文件"""
    video_path = os.path.abspath(video_path)

    if not os.path.exists(video_path):
        return {
            "file_path": video_path,
            "exists": False,
            "error": "文件不存在"
        }

    # 获取文件基本信息
    file_size = os.path.getsize(video_path)
    file_extension = os.path.splitext(video_path)[1].lower()

    diagnosis = {
        "file_path": video_path,
        "file_name": os.path.basename(video_path),
        "exists": True,
        "file_size_bytes": file_size,
        "file_size_mb": round(file_size / (1024 * 1024), 2),
        "file_extension": file_extension,
        "is_video": file_extension in ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm'],
    }

    if not diagnosis["is_video"]:
        diagnosis["error"] = "不是视频文件格式"
        return diagnosis

    # 使用video_analyzer.py中的函数进行元数据提取
    try:
        meta = read_video_meta(video_path)
        diagnosis["metadata"] = meta

        # 添加诊断结果
        diagnosis["diagnosis_success"] = meta.get("duration", 0) > 0
        diagnosis["validation_status"] = "success" if diagnosis["diagnosis_success"] else "failed"

        # 提供诊断建议
        if not diagnosis["diagnosis_success"]:
            diagnosis["recommendation"] = generate_recommendation(meta)

    except Exception as e:
        diagnosis["metadata_error"] = str(e)
        diagnosis["diagnosis_success"] = False
        diagnosis["validation_status"] = "error"
        diagnosis["recommendation"] = f"元数据提取失败: {e}"

    # 测试ffprobe可用性
    try:
        ffprobe_duration = get_duration_with_ffprobe(video_path)
        diagnosis["ffprobe_available"] = True
        diagnosis["ffprobe_duration"] = ffprobe_duration
    except Exception as e:
        diagnosis["ffprobe_available"] = False
        diagnosis["ffprobe_error"] = str(e)

    return diagnosis

def generate_recommendation(meta):
    """基于诊断结果生成建议"""
    diagnostics = meta.get("diagnostics", {})
    errors = diagnostics.get("errors", [])

    if not diagnostics.get("file_exists", False):
        return "文件不存在或无法访问"

    if diagnostics.get("file_size", 0) == 0:
        return "文件大小为0，可能是损坏的文件"

    if not diagnostics.get("opencv_success", False):
        return "OpenCV无法读取文件，可能是格式不支持或文件损坏"

    if not diagnostics.get("ffprobe_success", False):
        return "ffprobe无法获取信息，建议安装FFmpeg或检查文件格式"

    if diagnostics.get("duration") == 0:
        return "无法获取视频时长，可能是空文件或格式问题"

    return "未识别的问题，需要进一步检查"

def diagnose_test_videos_directory(test_videos_path):
    """诊断test-videos目录中的所有视频文件"""
    test_videos_path = os.path.abspath(test_videos_path)

    if not os.path.exists(test_videos_path):
        return {
            "directory_path": test_videos_path,
            "exists": False,
            "error": "测试视频目录不存在"
        }

    results = {
        "directory_path": test_videos_path,
        "exists": True,
        "total_files": 0,
        "video_files": 0,
        "successful_analyses": 0,
        "failed_analyses": 0,
        "files": []
    }

    # 遍历目录中的所有文件
    for file_name in os.listdir(test_videos_path):
        file_path = os.path.join(test_videos_path, file_name)

        if os.path.isfile(file_path):
            results["total_files"] += 1

            # 诊断每个文件
            diagnosis = diagnose_video_file(file_path)
            results["files"].append(diagnosis)

            if diagnosis.get("is_video", False):
                results["video_files"] += 1

                if diagnosis.get("diagnosis_success", False):
                    results["successful_analyses"] += 1
                else:
                    results["failed_analyses"] += 1

    # 计算成功率
    if results["video_files"] > 0:
        results["success_rate"] = round(results["successful_analyses"] / results["video_files"] * 100, 2)
    else:
        results["success_rate"] = 0

    return results

def print_diagnosis_summary(results):
    """打印诊断摘要"""
    print("\n" + "="*80)
    print("视频文件诊断报告")
    print("="*80)

    if not results.get("exists", False):
        print(f"[错误] 目录不存在: {results.get('directory_path')}")
        return

    print(f"测试目录: {results['directory_path']}")
    print(f"总文件数: {results['total_files']}")
    print(f"视频文件数: {results['video_files']}")
    print(f"成功分析: {results['successful_analyses']}")
    print(f"分析失败: {results['failed_analyses']}")
    print(f"成功率: {results['success_rate']}%")

    if results["video_files"] == 0:
        print("\n[警告] 未找到视频文件")
        return

    print("\n详细结果:")
    print("-" * 80)

    for file_result in results["files"]:
        if not file_result.get("is_video", False):
            continue

        file_name = file_result["file_name"]
        status = "[成功]" if file_result.get("diagnosis_success", False) else "[失败]"
        size_mb = file_result.get("file_size_mb", 0)

        print(f"\n{status} {file_name} ({size_mb}MB)")

        if file_result.get("diagnosis_success", False):
            duration = file_result.get("metadata", {}).get("duration", 0)
            width = file_result.get("metadata", {}).get("width", "unknown")
            height = file_result.get("metadata", {}).get("height", "unknown")
            resolution = f"{width}x{height}" if width != "unknown" and height != "unknown" else "unknown"
            print(f"   时长: {duration}秒")
            print(f"   分辨率: {resolution}")
            print(f"   帧率: {file_result.get('metadata', {}).get('frameRate', 'unknown')}")
        else:
            recommendation = file_result.get("recommendation", "未知错误")
            print(f"   问题: {recommendation}")

        # FFprobe状态
        if file_result.get("ffprobe_available", False):
            ffprobe_duration = file_result.get("ffprobe_duration")
            if ffprobe_duration:
                print(f"   FFprobe时长: {ffprobe_duration}秒")
            else:
                print(f"   FFprobe: 无法获取时长")
        else:
            print(f"   FFprobe: 不可用")

def main():
    parser = argparse.ArgumentParser(description="视频文件诊断工具")
    parser.add_argument(
        '--test-videos-dir',
        default='test-videos',
        help='test-videos目录路径 (默认: test-videos)'
    )
    parser.add_argument(
        '--file',
        help='诊断单个视频文件'
    )
    parser.add_argument(
        '--output',
        help='输出诊断结果到JSON文件'
    )
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='显示详细输出'
    )

    args = parser.parse_args()

    if args.file:
        # 诊断单个文件
        print(f"正在诊断单个文件: {args.file}")
        result = diagnose_video_file(args.file)

        if args.verbose:
            print(json.dumps(result, indent=2, ensure_ascii=False))
        else:
            print_diagnosis_summary({"files": [result], "exists": True})

        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
            print(f"\n结果已保存到: {args.output}")
    else:
        # 诊断整个test-videos目录
        print(f"正在诊断目录: {args.test_videos_dir}")
        results = diagnose_test_videos_directory(args.test_videos_dir)

        print_diagnosis_summary(results)

        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            print(f"\n详细结果已保存到: {args.output}")

        # 提供修复建议
        if results.get("success_rate", 0) < 100:
            print("\n[修复建议]:")
            if results.get("failed_analyses", 0) > 0:
                print("1. 检查失败的视频文件是否损坏")
                print("2. 确保安装了FFmpeg和ffprobe")
                print("3. 更新OpenCV到最新版本")
                print("4. 检查视频文件格式是否受支持")

if __name__ == '__main__':
    main()