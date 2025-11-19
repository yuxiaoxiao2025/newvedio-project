/**
 * AI分析测试数据工厂
 * 基于Qwen模型最佳实践生成真实的测试数据场景
 */

/**
 * 视频文件数据工厂
 */
export class VideoDataFactory {
  /**
   * 生成个人视频测试数据
   * @param {Object} options 配置选项
   * @returns {Object} 视频文件数据
   */
  static createPersonalVideo(options = {}) {
    const defaults = {
      scenario: 'family_trip',
      duration: 180,
      quality: 'high',
      participants: 2,
      locations: ['home', 'outdoor', 'restaurant'],
      activities: ['walking', 'talking', 'dining']
    }

    const config = { ...defaults, ...options }

    const scenarios = {
      family_trip: {
        name: 'family-trip-vacation.mp4',
        description: '家庭度假旅行记录',
        participants: ['father', 'mother', 'child'],
        emotions: ['happy', 'excited', 'relaxed'],
        locations: ['beach', 'hotel', 'restaurant', 'attraction'],
        activities: ['sightseeing', 'swimming', 'dining', 'shopping'],
        tags: ['family', 'vacation', 'travel', 'memory']
      },
      birthday_party: {
        name: 'birthday-celebration.mp4',
        description: '生日聚会庆祝活动',
        participants: ['friends', 'family'],
        emotions: ['joyful', 'celebratory', 'energetic'],
        locations: ['home', 'venue', 'party_room'],
        activities: ['singing', 'cake_cutting', 'games', 'gift_opening'],
        tags: ['birthday', 'celebration', 'friends', 'party']
      },
      sports_activity: {
        name: 'morning-exercise.mp4',
        description: '晨间运动健身记录',
        participants: ['athlete', 'trainer'],
        emotions: ['focused', 'determined', 'energetic'],
        locations: ['gym', 'outdoor', 'park'],
        activities: ['running', 'weight_lifting', 'stretching', 'coaching'],
        tags: ['sports', 'fitness', 'health', 'exercise']
      },
      cooking_class: {
        name: 'cooking-lesson.mp4',
        description: '烹饪课程学习过程',
        participants: ['students', 'instructor'],
        emotions: ['curious', 'creative', 'satisfied'],
        locations: ['kitchen', 'classroom'],
        activities: ['chopping', 'cooking', 'plating', 'tasting'],
        tags: ['cooking', 'learning', 'food', 'creativity']
      }
    }

    const scenario = scenarios[config.scenario] || scenarios.family_trip

    return {
      // 基本信息
      id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: scenario.name,
      type: 'personal',
      size: config.duration * 1.5 * 1024 * 1024, // 1.5MB per second
      format: 'mp4',
      duration: config.duration,
      quality: config.quality,
      createdAt: new Date().toISOString(),

      // 详细内容
      scenario: config.scenario,
      description: scenario.description,
      participants: config.participants,
      emotions: scenario.emotions,
      locations: scenario.locations,
      activities: scenario.activities,
      tags: scenario.tags,

      // 技术属性
      resolution: '1920x1080',
      frameRate: 30,
      bitrate: 8000,
      codec: 'H.264',
      audioChannels: 2,
      sampleRate: 44100,

      // 元数据
      metadata: {
        device: 'iPhone 14 Pro',
        app: 'Camera App',
        weather: config.weather || 'sunny',
        timeOfDay: config.timeOfDay || 'afternoon',
        season: config.season || 'summer'
      }
    }
  }

  /**
   * 生成景区视频测试数据
   * @param {Object} options 配置选项
   * @returns {Object} 视频文件数据
   */
  static createScenicVideo(options = {}) {
    const defaults = {
      location: 'mountain_landscape',
      duration: 240,
      quality: '4k',
      weather: 'clear',
      timeOfDay: 'golden_hour',
      features: ['wide_angle', 'slow_motion', 'time_lapse']
    }

    const config = { ...defaults, ...options }

    const locations = {
      mountain_landscape: {
        name: 'mountain-peak-sunset.mp4',
        description: '山峰日落美景记录',
        landscape: ['mountain', 'cloud_sea', 'forest'],
        features: ['panorama', 'slow_motion', 'color_grading'],
        weather: ['clear', 'partly_cloudy'],
        tags: ['mountain', 'sunset', 'nature', 'landscape']
      },
      waterfall_scene: {
        name: 'waterfall-cascade.mp4',
        description: '瀑布流水景观拍摄',
        landscape: ['waterfall', 'stream', 'rocks', 'vegetation'],
        features: ['close_up', 'macro', 'smooth_motion'],
        weather: ['misty', 'humid'],
        tags: ['waterfall', 'nature', 'cascade', 'serene']
      },
      city_night: {
        name: 'city-night-lights.mp4',
        description: '城市夜景延时摄影',
        landscape: ['buildings', 'streets', 'traffic_lights', 'billboards'],
        features: ['time_lapse', 'long_exposure', 'light_trails'],
        weather: ['clear'],
        tags: ['city', 'night', 'urban', 'architecture']
      },
      ocean_beach: {
        name: 'ocean-sunset.mp4',
        description: '海边日落风景视频',
        landscape: ['ocean', 'waves', 'sand', 'sky'],
        features: ['wide_angle', 'slow_motion', 'reflection'],
        weather: ['clear', 'breezy'],
        tags: ['ocean', 'beach', 'sunset', 'serene']
      }
    }

    const location = locations[config.location] || locations.mountain_landscape

    return {
      // 基本信息
      id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: location.name,
      type: 'scenic',
      size: config.duration * 2.5 * 1024 * 1024, // 2.5MB per second (4K quality)
      format: 'mp4',
      duration: config.duration,
      quality: config.quality,
      createdAt: new Date().toISOString(),

      // 详细内容
      location: config.location,
      description: location.description,
      landscape: location.landscape,
      features: location.features,
      weather: location.weather,
      tags: location.tags,

      // 技术属性
      resolution: config.quality === '4k' ? '3840x2160' : '1920x1080',
      frameRate: 30,
      bitrate: config.quality === '4k' ? 15000 : 8000,
      codec: 'H.265',
      audioChannels: 2,
      sampleRate: 48000,

      // 元数据
      metadata: {
        device: 'Sony A7S IV',
        app: 'Filmic Pro',
        gps: config.gps || { latitude: 35.6895, longitude: 139.6917 },
        altitude: config.altitude || 1500,
        direction: config.direction || 'west'
      }
    }
  }

  /**
   * 生成测试用例数据集
   * @param {string} type 数据集类型
   * @param {number} size 数据集大小
   * @returns {Array} 测试数据数组
   */
  static createTestDataSet(type = 'mixed', size = 10) {
    const datasets = {
      personal: Array.from({ length: size }, (_, i) =>
        this.createPersonalVideo({
          scenario: Object.keys(this.getPersonalScenarios())[i % 3],
          duration: 60 + (i * 30)
        })
      ),
      scenic: Array.from({ length: size }, (_, i) =>
        this.createScenicVideo({
          location: Object.keys(this.getScenicLocations())[i % 4],
          duration: 120 + (i * 60)
        })
      ),
      mixed: Array.from({ length: size }, (_, i) =>
        i % 2 === 0
          ? this.createPersonalVideo({ duration: 120 + (i * 30) })
          : this.createScenicVideo({ duration: 180 + (i * 60) })
      )
    }

    return datasets[type] || datasets.mixed
  }

  /**
   * 生成边界测试数据
   * @returns {Array} 边界测试数据
   */
  static createBoundaryTestData() {
    return {
      oversized: this.createPersonalVideo({ duration: 3600, size: 500 * 1024 * 1024 }), // 1小时，500MB
      minimal: this.createPersonalVideo({ duration: 10, size: 1 * 1024 * 1024 }),    // 10秒，1MB
      longestName: this.createPersonalVideo({
        name: 'very-long-video-file-name-that-exceeds-normal-limits-and-should-test-handling-capabilities.mp4'
      }),
      specialChars: this.createScenicVideo({
        name: '测试-视频文件名 with special-chars & symbols !@#$%^&*()_+-=[]{}|;:",\'",
        location: 'special_char_test'
      }),
      unicode: this.createPersonalVideo({
        name: '测试视频🎬🌟💐🎯 celebration.mp4',
        scenario: 'unicode_test'
      })
    }
  }

  /**
   * 获取个人视频场景类型
   */
  static getPersonalScenarios() {
    return {
      family_trip: '家庭旅行',
      birthday_party: '生日聚会',
      sports_activity: '运动活动',
      cooking_class: '烹饪课程',
      meeting: '商务会议',
      interview: '面试记录',
      performance: '表演现场',
      ceremony: '仪式活动'
    }
  }

  /**
   * 获取景区视频地点类型
   */
  static getScenicLocations() {
    return {
      mountain_landscape: '山岳风光',
      waterfall_scene: '瀑布景观',
      city_night: '城市夜景',
      ocean_beach: '海边风光',
      forest_trail: '森林小径',
      desert_dunes: '沙漠沙丘',
      glacier_ice: '冰川雪山',
      countryside: '乡村田野'
    }
  }

  /**
   * 验证视频数据完整性
   * @param {Object} videoData 视频数据
   * @returns {Object} 验证结果
   */
  static validateVideoData(videoData) {
    const errors = []
    const warnings = []

    // 必需字段验证
    const requiredFields = ['id', 'name', 'type', 'size', 'format', 'duration']
    requiredFields.forEach(field => {
      if (!videoData[field]) {
        errors.push(`Missing required field: ${field}`)
      }
    })

    // 类型验证
    if (videoData.type && !['personal', 'scenic'].includes(videoData.type)) {
      errors.push(`Invalid video type: ${videoData.type}`)
    }

    // 数值范围验证
    if (videoData.duration && (videoData.duration < 1 || videoData.duration > 7200)) {
      errors.push(`Invalid duration: ${videoData.duration} seconds (1-7200 seconds allowed)`)
    }

    if (videoData.size && (videoData.size < 1024 || videoData.size > 1024 * 1024 * 1024)) {
      errors.push(`Invalid size: ${videoData.size} bytes (1KB-1GB allowed)`)
    }

    // 格式验证
    if (videoData.format && !['mp4', 'avi', 'mov'].includes(videoData.format)) {
      errors.push(`Invalid format: ${videoData.format} (mp4, avi, mov allowed)`)
    }

    // 警告验证
    if (videoData.size && videoData.size > 300 * 1024 * 1024) {
      warnings.push(`Large file size: ${Math.round(videoData.size / 1024 / 1024)}MB (consider compression)`)
    }

    if (videoData.duration && videoData.duration > 600) {
      warnings.push(`Long duration: ${videoData.duration} seconds (may affect processing time)`)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, 100 - errors.length * 20 - warnings.length * 5)
    }
  }

  /**
   * 创建AI分析预期结果
   * @param {Object} videoData 视频数据
   * @param {string} analysisType 分析类型
   * @returns {Object} 预期分析结果
   */
  static createExpectedAnalysis(videoData, analysisType = 'content') {
    const baseAnalysis = {
      duration: videoData.duration,
      confidence: 0.85 + Math.random() * 0.14, // 85-99%
      processingTime: Math.round(videoData.duration * 100 + Math.random() * 1000), // 100ms-1.1s
      timestamp: new Date().toISOString()
    }

    if (analysisType === 'content') {
      return {
        ...baseAnalysis,
        type: 'content',
        keyframes: Math.max(5, Math.floor(videoData.duration / 15)),
        scenes: Math.max(3, Math.floor(videoData.duration / 60)),
        objects: Math.max(2, Math.floor(videoData.duration / 90)),
        emotions: videoData.emotions?.length || 0,
        locations: videoData.locations?.length || 0
      }
    } else if (analysisType === 'fusion') {
      return {
        ...baseAnalysis,
        type: 'fusion',
        segments: 3 + Math.floor(Math.random() * 3),
        transitions: 2 + Math.floor(Math.random() * 2),
        targetDuration: 30 + Math.floor(Math.random() * 30),
        complexity: videoData.type === 'scenic' ? 'medium' : 'low'
      }
    } else if (analysisType === 'music') {
      return {
        ...baseAnalysis,
        type: 'music',
        duration: 60, // 固定60秒背景音乐
        style: videoData.type === 'scenic' ? 'ambient' : 'celebratory',
        tempo: videoData.type === 'scenic' ? 60 + Math.floor(Math.random() * 40) : 120 + Math.floor(Math.random() * 40),
        instruments: videoData.type === 'scenic' ? ['piano', 'strings', 'ambient'] : ['guitar', 'drums', 'vocals']
      }
    }

    return baseAnalysis
  }
}

/**
 * AI分析结果模拟器
 */
export class AIAnalysisSimulator {
  /**
   * 模拟VL模型分析结果
   * @param {Object} videoData 视频数据
   * @param {Object} options 模拟选项
   * @returns {Object} VL分析结果
   */
  static simulateVLAnalysis(videoData, options = {}) {
    const { accuracy = 0.9, detailLevel = 'high' } = options

    const baseKeyframes = Math.floor(videoData.duration / 10)
    const baseScenes = Math.floor(videoData.duration / 45)

    // 关键帧生成
    const keyframes = []
    for (let i = 0; i < baseKeyframes; i++) {
      const timestamp = Math.floor(i * 10)
      keyframes.push({
        timestamp: `${Math.floor(timestamp / 60).toString().padStart(2, '0')}:${(timestamp % 60).toString().padStart(2, '0')}`,
        description: this.generateKeyframeDescription(videoData, i, timestamp),
        confidence: accuracy * (0.8 + Math.random() * 0.2),
        visual_elements: this.extractVisualElements(videoData, i, timestamp)
      })
    }

    // 场景分析
    const scenes = []
    if (videoData.type === 'personal') {
      scenes.push(
        {
          type: '人物特写',
          startTime: '00:00',
          endTime: this.formatTime(Math.floor(videoData.duration * 0.2)),
          confidence: accuracy * 0.9,
          description: '人物面部表情和动作特写'
        },
        {
          type: '活动场景',
          startTime: this.formatTime(Math.floor(videoData.duration * 0.2)),
          endTime: this.formatTime(Math.floor(videoData.duration * 0.7)),
          confidence: accuracy * 0.85,
          description: '主要活动进行场景'
        },
        {
          type: '环境展示',
          startTime: this.formatTime(Math.floor(video.duration * 0.7)),
          endTime: this.formatTime(videoData.duration),
          confidence: accuracy * 0.8,
          description: '周围环境和背景展示'
        }
      )
    } else if (videoData.type === 'scenic') {
      scenes.push(
        {
          type: '远景景观',
          startTime: '00:00',
          endTime: this.formatTime(Math.floor(videoData.duration * 0.3)),
          confidence: accuracy * 0.9,
          description: '整体景观构图和视野'
        },
        {
          type: '中景展示',
          startTime: this.formatTime(Math.floor(videoData.duration * 0.3)),
          endTime: this.formatTime(Math.floor(videoData.duration * 0.8)),
          confidence: accuracy * 0.88,
          description: '景观细节和特色元素'
        },
        {
          type: '特写细节',
          startTime: this.formatTime(Math.floor(videoData.duration * 0.8)),
          endTime: this.formatTime(videoData.duration),
          confidence: accuracy * 0.85,
          description: '景观细微特征和质感'
        }
      )
    }

    // 对象检测
    const objects = this.detectObjects(videoData, accuracy)

    // 动作识别
    const actions = this.detectActions(videoData, accuracy)

    // 情感分析
    const emotions = this.analyzeEmotions(videoData, accuracy)

    return {
      keyframes,
      scenes,
      objects,
      actions,
      emotions,
      metadata: {
        model: 'qwen3-vl-max',
        accuracy,
        detailLevel,
        processingTime: Math.round(videoData.duration * 15)
      }
    }
  }

  /**
   * 模拟最终报告生成
   * @param {Object} vlAnalysis VL分析结果
   * @param {Object} videoData 视频数据
   * @returns {string} 格式化的分析报告
   */
  static simulateFinalReport(vlAnalysis, videoData) {
    const reportSections = []

    // 报告头部
    reportSections.push(`# ${videoData.type === 'personal' ? '个人' : '景区'}视频内容分析报告`)

    // 基本信息
    reportSections.push('## 基本信息')
    reportSections.push(`- 视频时长: ${this.formatTime(videoData.duration)}`)
    reportSections.push(`- 文件格式: ${videoData.format.toUpperCase()}`)
    reportSections.push(`- 分辨率: ${videoData.resolution}`)
    reportSections.push(`- 文件大小: ${(videoData.size / 1024 / 1024).toFixed(1)}MB`)
    reportSections.push(`- 创建时间: ${new Date(videoData.createdAt).toLocaleString()}`)

    // 内容分析
    reportSections.push('\n## 内容分析')

    // 关键帧分析
    reportSections.push('### 关键帧分析')
    reportSections.push(`识别到 ${vlAnalysis.keyframes.length} 个关键帧，主要记录了${videoData.type === 'personal' ? '人物活动' : '自然景观'}的重要瞬间。`)

    if (vlAnalysis.keyframes.length > 0) {
      reportSections.push('\n主要关键帧时间点:')
      vlAnalysis.keyframes.slice(0, 5).forEach((kf, index) => {
        reportSections.push(`${index + 1}. ${kf.timestamp} - ${kf.description}`)
      })
    }

    // 场景分类
    reportSections.push('\n### 场景分类')
    vlAnalysis.scenes.forEach((scene, index) => {
      const duration = this.calculateDuration(scene.startTime, scene.endTime)
      reportSections.push(`- ${scene.type}: ${scene.startTime} - ${scene.endTime} (${this.formatTime(duration)})`)
    })

    // 对象检测
    if (vlAnalysis.objects.length > 0) {
      reportSections.push('\n### 物体检测')
      reportSections.push(`识别到 ${vlAnalysis.objects.length} 个主要物体:`)
      vlAnalysis.objects.forEach(obj => {
        reportSections.push(`- ${obj.name}: 出现${obj.appearances.length}次`)
      })
    }

    // 动作识别
    if (vlAnalysis.actions.length > 0) {
      reportSections.push('\n### 动作识别')
      reportSections.push(`检测到 ${vlAnalysis.actions.length} 个主要动作:`)
      vlAnalysis.actions.forEach(action => {
        reportSections.push(`- ${action.action}: ${action.startTime} - ${action.endTime}`)
      })
    }

    // 情感分析
    if (vlAnalysis.emotions && Object.keys(vlAnalysis.emotions).length > 0) {
      reportSections.push('\n### 情感分析')
      const dominantEmotion = Object.entries(vlAnalysis.emotions)
        .sort((a, b) => b[1] - a[1])[0]
      reportSections.push(`- 主导情感: ${dominantEmotion[0]} (${dominantEmotion[1]}%)`)
    }

    // 技术评估
    reportSections.push('\n## 技术评估')

    const avgConfidence = vlAnalysis.keyframes.reduce((sum, kf) => sum + kf.confidence, 0) / vlAnalysis.keyframes.length
    reportSections.push(`- 分析置信度: ${(avgConfidence * 100).toFixed(1)}%`)
    reportSections.push(`- 场景识别准确率: ${(vlAnalysis.scenes.reduce((sum, s) => sum + s.confidence, 0) / vlAnalysis.scenes.length * 100).toFixed(1)}%`)

    // 总结建议
    reportSections.push('\n## 总结建议')
    if (videoData.type === 'personal') {
      reportSections.push('该视频展现了生动的人物活动，情感表达丰富，叙事性良好。')
      reportSections.push('建议保持当前拍摄风格，可在转场处增加更多创意元素。')
    } else {
      reportSections.push('该视频展现了优美的自然景观，视觉层次丰富，构图专业。')
      reportStates.push('建议继续关注光线变化，捕捉更多独特视角。')
    }

    return reportSections.join('\n')
  }

  /**
   * 生成关键帧描述
   */
  static generateKeyframeDescription(videoData, index, timestamp) {
    const descriptions = {
      personal: [
        '人物表情特写，展现情感变化',
        '动作细节，记录活动过程',
        '环境背景，展示活动场景',
        '互动瞬间，体现人物关系'
      ],
      scenic: [
        '自然景观的全景展示',
        '光线变化营造的氛围',
        '细节特写突出自然特征',
        '色彩变化展现季节特征'
      ]
    }

    const typeDescriptions = videoData.type === 'personal' ? descriptions.personal : descriptions.scenic
    const descriptionIndex = index % typeDescriptions.length

    return typeDescriptions[descriptionIndex]
  }

  /**
   * 提取视觉元素
   */
  static extractVisualElements(videoData, index, timestamp) {
    if (videoData.type === 'personal') {
      return {
        people: videoData.participants,
        objects: videoData.activities.map(act => ({ item: act + '_equipment', count: 1 })),
        colors: ['warm_colors', 'natural_tones']
      }
    } else {
      return {
        landscape: videoData.landscape || ['natural'],
        elements: videoData.features || ['panoramic', 'wide_angle'],
        colors: ['cool_colors', 'vibrant_colors']
      }
    }
  }

  /**
   * 检测对象
   */
  static detectObjects(videoData, accuracy) {
    const objects = []

    if (videoData.type === 'personal') {
      // 基于场景和活动推断对象
      if (videoData.activities) {
        videoData.activities.forEach(activity => {
          if (activity.includes('walking')) {
            objects.push({ name: 'pedestrian', confidence: accuracy * 0.9, count: 1 })
          }
          if (activity.includes('dining')) {
            objects.push({ name: 'table', confidence: accuracy * 0.8, count: 1 })
            objects.push({ name: 'food', confidence: accuracy * 0.7, count: 1 })
          }
        })
      }

      if (videoData.participants) {
        videoData.participants.forEach(participant => {
          objects.push({ name: 'person', confidence: accuracy * 0.95, count: 1 })
        })
      }
    } else if (videoData.type === 'scenic') {
      if (videoData.landscape) {
        videoData.landscape.forEach(element => {
          objects.push({ name: element, confidence: accuracy * 0.85, count: 1 })
        })
      }
    }

    return objects
  }

  /**
   * 检测动作
   */
  static detectActions(videoData, accuracy) {
    const actions = []

    if (videoData.activities) {
      videoData.activities.forEach(activity => {
        actions.push({
          action: activity,
          confidence: accuracy * 0.8,
          frequency: 'moderate'
        })
      })
    }

    return actions
  }

  /**
   * 分析情感
   */
  static analyzeEmotions(videoData, accuracy) {
    const emotions = {}

    if (videoData.emotions) {
      videoData.emotions.forEach(emotion => {
        emotions[emotion] = 0.5 + Math.random() * 0.5
      })
    }

    return emotions
  }

  /**
   * 格式化时间
   */
  static formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  /**
   * 计算时长差
   */
  static calculateDuration(startTime, endTime) {
    const [startMin, startSec] = startTime.split(':').map(Number)
    const [endMin, endSec] = endTime.split(':').map(Number)
    return (endMin * 60 + endSec) - (startMin * 60 + startSec)
  }
}

export { VideoDataFactory, AIAnalysisSimulator }