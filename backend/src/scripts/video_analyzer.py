import os
import sys
import json
import argparse
import re

def to_file_url(p):
    p = os.path.abspath(p)
    if re.match(r'^[a-zA-Z]:\\', p):
        return 'file://' + p.replace('\\', '/')
    return 'file://' + p

def read_video_meta(local_path):
    meta = {
        "duration": 0,
        "frameRate": None,
        "width": None,
        "height": None,
        "frames": None
    }
    try:
        import cv2
        cap = cv2.VideoCapture(local_path)
        if cap.isOpened():
            fps = cap.get(cv2.CAP_PROP_FPS)
            total = cap.get(cv2.CAP_PROP_FRAME_COUNT)
            w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            meta["frameRate"] = float(fps) if fps and fps > 0 else None
            meta["frames"] = int(total) if total and total > 0 else None
            meta["width"] = w if w > 0 else None
            meta["height"] = h if h > 0 else None
            if meta["frameRate"] and meta["frames"]:
                meta["duration"] = round(meta["frames"] / meta["frameRate"])
        cap.release()
    except Exception:
        pass
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
        "actions": []
    }
    if isinstance(ai, dict) and not ai.get("error"):
        for k in ["duration", "frameRate", "resolution", "frames", "keyframeCount", "sceneCount", "objectCount", "actionCount", "keyframes", "scenes", "objects", "actions", "vlAnalysis", "finalReport", "structuredData"]:
            if k in ai and ai[k] is not None:
                base[k] = ai[k]
    return base

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--video-path', required=True)
    parser.add_argument('--type', default='content')
    parser.add_argument('--fps', type=float, default=2.0)
    parser.add_argument('--prompt', default='请以JSON格式输出：{"duration":秒数,"frameRate":帧率,"resolution":"WxH","frames":总帧数,"keyframeCount":数量,"sceneCount":数量,"objectCount":数量,"actionCount":数量,"keyframes":[],"scenes":[],"objects":[],"actions":[],"vlAnalysis":{},"finalReport":{},"structuredData":{}}')
    args = parser.parse_args()

    local_path = args.video_path
    meta = read_video_meta(local_path)
    url = to_file_url(local_path)
    ai, usage = call_dashscope(url, args.prompt, args.fps)
    result = build_result(meta, ai)

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

if __name__ == '__main__':
    main()