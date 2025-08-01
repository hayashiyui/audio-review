import { useState, useEffect } from 'react'

// シュレーダー周波数計算機コンポーネント
const SchroederCalculator = () => {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // data-theme属性でダークモード検出
    const updateDarkMode = () => {
      const theme = document.documentElement.getAttribute('data-theme')
      setIsDark(theme === 'dark')
    }
    
    // 初期設定
    updateDarkMode()
    
    // data-theme属性の変更を監視
    const observer = new MutationObserver(updateDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })
    
    return () => observer.disconnect()
  }, [])

  // テーマに応じた色設定
  const theme = {
    background: isDark ? '#1a1a1a' : '#f8f9fa',
    surface: isDark ? '#2d2d2d' : 'white',
    text: isDark ? '#e0e0e0' : '#2c3e50',
    textSecondary: isDark ? '#b0b0b0' : '#666',
    border: isDark ? '#404040' : '#e9ecef',
    success: isDark ? '#10b981' : '#27ae60',
    warning: isDark ? '#f59e0b' : '#f39c12',
    error: isDark ? '#ef4444' : '#e74c3c',
    info: isDark ? '#3b82f6' : '#007bff',
    successBg: isDark ? '#064e3b' : '#d4edda',
    warningBg: isDark ? '#78350f' : '#fff3cd',
    errorBg: isDark ? '#7f1d1d' : '#ffebee',
    infoBg: isDark ? '#1e3a8a' : '#e8f4fd'
  }
  const [dimensions, setDimensions] = useState({
    length: 5.0,
    width: 3.5,
    height: 2.4
  })
  const [rt60, setRt60] = useState(0.4)

  // 容積の計算
  const volume = dimensions.length * dimensions.width * dimensions.height

  // シュレーダー周波数の計算
  const schroederFreq = Math.round(2000 * Math.sqrt(rt60 / volume))

  // 残響時間の評価（より精密な推奨値）
  const evaluateRT60 = (rt60, volume) => {
    // リスニングルーム用推奨値：Sabine式に基づく実用的推奨値
    // 小部屋: 0.25-0.35秒、中部屋: 0.35-0.45秒、大部屋: 0.45-0.55秒
    let recommendedMin, recommendedMax
    
    if (volume < 30) {
      recommendedMin = 0.25
      recommendedMax = 0.35
    } else if (volume < 60) {
      recommendedMin = 0.30 + (volume - 30) * 0.005 // 30-60m³で0.30-0.45
      recommendedMax = 0.40 + (volume - 30) * 0.005
    } else {
      recommendedMin = 0.40
      recommendedMax = 0.55
    }
    
    if (rt60 < recommendedMin - 0.05) return { 
      status: 'short', 
      color: '#f39c12', 
      text: `短め（推奨${recommendedMin.toFixed(2)}-${recommendedMax.toFixed(2)}秒）` 
    }
    if (rt60 > recommendedMax + 0.05) return { 
      status: 'long', 
      color: '#e74c3c', 
      text: `長め（推奨${recommendedMin.toFixed(2)}-${recommendedMax.toFixed(2)}秒）` 
    }
    return { 
      status: 'good', 
      color: '#27ae60', 
      text: `適切（推奨範囲${recommendedMin.toFixed(2)}-${recommendedMax.toFixed(2)}秒）` 
    }
  }

  const rt60Evaluation = evaluateRT60(rt60, volume)

  // 対策の推奨事項
  const getRecommendations = (freq) => {
    const recommendations = {
      wave: [], // 低域（波の領域）
      ray: []   // 高域（光線の領域）
    }

    if (freq < 150) {
      recommendations.wave.push('非常に低い境界周波数 - 広範囲でモード対策が必要')
      recommendations.wave.push('コーナートラップを重点的に配置')
      recommendations.ray.push('150Hz以上の広い帯域で反射音制御')
    } else if (freq < 200) {
      recommendations.wave.push('標準的な境界周波数 - バランスの取れた対策を')
      recommendations.wave.push('主要な軸モードにベーストラップ')
      recommendations.ray.push('200Hz以上で吸音・拡散処理')
    } else if (freq < 300) {
      recommendations.wave.push('やや高い境界周波数 - 限定的なモード対策')
      recommendations.wave.push('最も問題となるモードのみ対策')
      recommendations.ray.push('300Hz以上で反射音制御')
    } else {
      recommendations.wave.push('高い境界周波数 - モード問題は限定的')
      recommendations.wave.push('深刻な軸モードのみ対策')
      recommendations.ray.push('広範囲で反射音制御が必要')
    }

    return recommendations
  }

  const recommendations = getRecommendations(schroederFreq)

  // 残響時間の参考値
  const rt60Guide = [
    { type: 'デッドな部屋', range: '0.2-0.3秒', desc: '録音スタジオ、吸音材多め' },
    { type: '標準的なリスニングルーム', range: '0.3-0.5秒', desc: '家庭での音楽鑑賞に適した響き' },
    { type: '響きのある部屋', range: '0.5-0.8秒', desc: 'ライブ感のある響き、クラシック向け' },
    { type: 'エコーの多い部屋', range: '0.8秒以上', desc: '響きすぎ、対策が必要' }
  ]

  return (
    <div style={{ 
      fontFamily: 'sans-serif', 
      maxWidth: '700px', 
      margin: '0 auto',
      backgroundColor: theme.background,
      padding: '20px',
      borderRadius: '12px',
      border: `1px solid ${theme.border}`
    }}>
      <h4 style={{ 
        margin: '0 0 16px 0', 
        fontSize: '18px', 
        fontWeight: 'bold',
        textAlign: 'center',
        color: theme.text
      }}>
        📊 シュレーダー周波数計算機
      </h4>
      
      <div style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '20px', textAlign: 'center' }}>
        部屋の音響対策の境界周波数を計算し、対策方針を決定します
      </div>

      {/* 寸法入力 */}
      <div style={{ marginBottom: '20px' }}>
        <h5 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: theme.text }}>
          📏 部屋の寸法
        </h5>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '12px',
          marginBottom: '12px'
        }}>
          {[
            { key: 'length', label: '奥行き', color: '#3498db' },
            { key: 'width', label: '幅', color: '#e74c3c' },
            { key: 'height', label: '高さ', color: '#27ae60' }
          ].map(({ key, label, color }) => (
            <div key={key} style={{ textAlign: 'center' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontWeight: 'bold',
                color: color,
                fontSize: '14px'
              }}>
                {label}
              </label>
              <input
                type="number"
                min="1.5"
                max="15"
                step="0.1"
                value={dimensions[key]}
                onChange={(e) => setDimensions(prev => ({
                  ...prev,
                  [key]: parseFloat(e.target.value) || 0
                }))}
                style={{
                  width: '80px',
                  padding: '6px',
                  fontSize: '14px',
                  textAlign: 'center',
                  border: `2px solid ${color}`,
                  borderRadius: '4px',
                  backgroundColor: theme.surface
                }}
              />
              <div style={{ fontSize: '11px', color: theme.text, marginTop: '2px' }}>
                (m)
              </div>
            </div>
          ))}
        </div>
        <div style={{ 
          textAlign: 'center', 
          fontSize: '14px', 
          color: theme.text,
          backgroundColor: theme.surface,
          padding: '8px',
          borderRadius: '6px',
          border: `1px solid ${theme.border}`
        }}>
          <strong>容積:</strong> {volume.toFixed(1)} m³ 
          <span style={{ fontSize: '12px', color: theme.text, marginLeft: '8px' }}>
            (約{Math.round(volume / 1.65)}畳)
          </span>
        </div>
      </div>

      {/* 残響時間入力 */}
      <div style={{ marginBottom: '24px' }}>
        <h5 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: theme.text }}>
          ⏱️ 残響時間（RT60）
        </h5>
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <input
            type="number"
            min="0.1"
            max="2.0"
            step="0.05"
            value={rt60}
            onChange={(e) => setRt60(parseFloat(e.target.value) || 0)}
            style={{
              width: '100px',
              padding: '8px',
              fontSize: '16px',
              textAlign: 'center',
              border: `2px solid ${rt60Evaluation.color}`,
              borderRadius: '6px',
              backgroundColor: theme.surface,
              fontWeight: 'bold'
            }}
          />
          <span style={{ marginLeft: '8px', fontSize: '14px' }}>秒</span>
        </div>
        <div style={{ 
          textAlign: 'center', 
          fontSize: '12px', 
          color: rt60Evaluation.color,
          fontWeight: 'bold' 
        }}>
          {rt60Evaluation.text}
        </div>
        
        {/* 残響時間ガイド */}
        <div style={{ 
          marginTop: '12px', 
          fontSize: '11px', 
          backgroundColor: theme.surface,
          padding: '10px',
          borderRadius: '6px',
          border: `1px solid ${theme.border}`
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '6px', color: theme.text }}>
            📝 残響時間の参考値
          </div>
          {rt60Guide.map((guide, index) => (
            <div key={index} style={{ marginBottom: '3px', display: 'flex', justifyContent: 'space-between', color: theme.text }}>
              <span style={{ fontWeight: 'bold' }}>{guide.type}:</span>
              <span>{guide.range}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 計算結果 */}
      <div style={{ 
        backgroundColor: theme.surface,
        padding: '20px',
        borderRadius: '10px',
        border: '3px solid #007bff',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <h5 style={{ 
          fontSize: '16px', 
          fontWeight: 'bold',
          color: '#007bff',
          marginBottom: '8px'
        }}>
          🎯 計算結果
        </h5>
        <div style={{ 
          fontSize: '28px', 
          fontWeight: 'bold', 
          color: theme.text,
          marginBottom: '8px'
        }}>
          {schroederFreq} Hz
        </div>
        <div style={{ fontSize: '14px', color: theme.textSecondary }}>
          シュレーダー周波数（境界周波数）
        </div>
      </div>

      {/* 対策方針 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        {/* 波の領域 */}
        <div style={{ 
          padding: '16px',
          backgroundColor: isDark ? '#7f1d1d' : '#ffebee',
          borderRadius: '8px',
          border: isDark ? '2px solid #f87171' : '2px solid #ff6b6b'
        }}>
          <h6 style={{ 
            fontSize: '14px', 
            fontWeight: 'bold', 
            marginBottom: '8px',
            color: isDark ? '#fca5a5' : '#d32f2f',
            textAlign: 'center'
          }}>
            🌊 波の領域（モード対策）
          </h6>
          <div style={{ 
            textAlign: 'center', 
            fontSize: '16px', 
            fontWeight: 'bold',
            marginBottom: '8px',
            color: isDark ? '#fca5a5' : '#d32f2f'
          }}>
            〜 {schroederFreq} Hz
          </div>
          <div style={{ fontSize: '11px', lineHeight: 1.4, color: theme.text }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>対策方針:</div>
            {recommendations.wave.map((rec, index) => (
              <div key={index} style={{ marginBottom: '2px' }}>• {rec}</div>
            ))}
          </div>
        </div>

        {/* 光線の領域 */}
        <div style={{ 
          padding: '16px',
          backgroundColor: isDark ? '#064e3b' : '#e8f5e8',
          borderRadius: '8px',
          border: isDark ? '2px solid #22d3ee' : '2px solid #4ecdc4'
        }}>
          <h6 style={{ 
            fontSize: '14px', 
            fontWeight: 'bold', 
            marginBottom: '8px',
            color: isDark ? '#86efac' : '#2e7d32',
            textAlign: 'center'
          }}>
            ☀️ 光線の領域（反射音対策）
          </h6>
          <div style={{ 
            textAlign: 'center', 
            fontSize: '16px', 
            fontWeight: 'bold',
            marginBottom: '8px',
            color: isDark ? '#86efac' : '#2e7d32'
          }}>
            {schroederFreq} Hz 〜
          </div>
          <div style={{ fontSize: '11px', lineHeight: 1.4, color: theme.text }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>対策方針:</div>
            {recommendations.ray.map((rec, index) => (
              <div key={index} style={{ marginBottom: '2px' }}>• {rec}</div>
            ))}
          </div>
        </div>
      </div>

      {/* 解釈とアドバイス */}
      <div style={{ 
        padding: '16px',
        backgroundColor: theme.infoBg,
        borderRadius: '8px',
        border: `1px solid ${theme.border}`
      }}>
        <h5 style={{ 
          fontSize: '14px', 
          fontWeight: 'bold', 
          marginBottom: '12px',
          color: theme.info
        }}>
          💡 解釈とアドバイス
        </h5>
        <div style={{ fontSize: '12px', lineHeight: 1.5, color: theme.text }}>
          <p style={{ marginBottom: '8px' }}>
            <strong>シュレーダー周波数とは：</strong>
            部屋の音響特性が「波」の性質から「光線」の性質に変わる境界周波数です。
          </p>
          <p style={{ marginBottom: '8px' }}>
            <strong>あなたの部屋では：</strong>
            {schroederFreq}Hz以下では定在波（モード）対策が、{schroederFreq}Hz以上では反射音制御が重要になります。
          </p>
          <p style={{ marginBottom: '0' }}>
            <strong>実践のポイント：</strong>
            まず{schroederFreq}Hz以下の軸モードを計算機で確認し、最も問題となる周波数から対策を始めましょう。
          </p>
        </div>
      </div>
    </div>
  )
}

export default SchroederCalculator