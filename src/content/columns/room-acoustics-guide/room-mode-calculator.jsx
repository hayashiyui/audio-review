import { useState, useEffect } from 'react'

// ルームモード計算機コンポーネント
const RoomModeCalculator = () => {
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
    successBg: isDark ? '#064e3b' : '#d4edda',
    warningBg: isDark ? '#78350f' : '#fff3cd',
    errorBg: isDark ? '#7f1d1d' : '#ffebee',
    infoBg: isDark ? '#1e3a8a' : '#e8f4fd'
  }

  const [dimensions, setDimensions] = useState({
    length: 5.0,  // 奥行き
    width: 3.5,   // 幅  
    height: 2.4   // 高さ
  })

  // 音速（20°Cでの近似値）
  const soundSpeed = 343

  // 周波数から音名への変換
  const frequencyToNote = (freq) => {
    if (freq < 30) return '超低音域'
    if (freq < 40) return 'B0付近'
    if (freq < 50) return 'C1-D1付近'
    if (freq < 65) return 'E1-C2付近'
    if (freq < 80) return 'D2-E2付近'
    if (freq < 100) return 'F2-G2付近'
    if (freq < 130) return 'A2-B2付近'
    if (freq < 160) return 'C3-D3付近'
    if (freq < 200) return 'E3-F#3付近'
    return '中音域'
  }

  // 軸モードの計算
  const calculateAxialModes = (dimension, axis) => {
    const modes = []
    for (let n = 1; n <= 4; n++) {
      const frequency = (n * soundSpeed) / (2 * dimension)
      if (frequency <= 300) { // 300Hz以下のモードのみ表示
        modes.push({
          mode: n,
          frequency: Math.round(frequency * 10) / 10,
          note: frequencyToNote(frequency),
          axis: axis
        })
      }
    }
    return modes
  }

  // 全軸モードを計算
  const allModes = [
    ...calculateAxialModes(dimensions.length, '奥行き'),
    ...calculateAxialModes(dimensions.width, '幅'),
    ...calculateAxialModes(dimensions.height, '高さ')
  ].sort((a, b) => a.frequency - b.frequency)

  // 問題のあるモード（近接した周波数）を検出
  const findProblematicModes = (modes) => {
    const problematic = []
    for (let i = 0; i < modes.length - 1; i++) {
      const current = modes[i]
      const next = modes[i + 1]
      const freqDiff = next.frequency - current.frequency
      // 相対値（5%）と絶対値（8Hz）の併用で判定
      const relativeThreshold = current.frequency * 0.05
      const absoluteThreshold = 8
      if (freqDiff < Math.max(relativeThreshold, absoluteThreshold)) {
        problematic.push({ current, next, diff: freqDiff })
      }
    }
    return problematic
  }

  const problematicModes = findProblematicModes(allModes)

  // おすすめの部屋比率かチェック
  const checkRoomRatio = () => {
    const ratio1 = dimensions.length / dimensions.width
    const ratio2 = dimensions.length / dimensions.height
    const ratio3 = dimensions.width / dimensions.height
    
    // 推奨比率：黄金比系（1:1.6:2.6）とBolt推奨比率
    const goldenRatio = 1.618  // 1:1.618
    const goldenRatio2 = 2.618 // 1:2.618 (φ²)
    const boltRatio1 = 1.6     // Bolt推奨
    const boltRatio2 = 2.3     // Bolt推奨
    
    const isGoodRatio = (
      Math.abs(ratio1 - goldenRatio) < 0.15 ||
      Math.abs(ratio1 - boltRatio1) < 0.15 ||
      Math.abs(ratio2 - goldenRatio2) < 0.2 ||
      Math.abs(ratio2 - boltRatio2) < 0.2
    )
    
    return { isGood: isGoodRatio, ratios: [ratio1, ratio2, ratio3] }
  }

  const roomRatioCheck = checkRoomRatio()

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
        🧮 あなたの部屋のルームモード計算機
      </h4>
      
      <div style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '20px', textAlign: 'center' }}>
        部屋の寸法を入力すると、問題となる定在波の周波数を計算します
      </div>

      {/* 寸法入力 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        {[
          { key: 'length', label: '奥行き', color: isDark ? '#60a5fa' : '#3498db' },
          { key: 'width', label: '幅', color: isDark ? '#f87171' : '#e74c3c' },
          { key: 'height', label: '高さ', color: isDark ? '#34d399' : '#27ae60' }
        ].map(({ key, label, color }) => (
          <div key={key} style={{ textAlign: 'center' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
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
                padding: '8px',
                fontSize: '16px',
                textAlign: 'center',
                border: `2px solid ${color}`,
                borderRadius: '6px',
                backgroundColor: theme.surface,
                color: theme.text
              }}
            />
            <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '4px' }}>
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
        <strong>容積:</strong> {(dimensions.length * dimensions.width * dimensions.height).toFixed(1)} m³ 
        <span style={{ fontSize: '12px', color: theme.textSecondary, marginLeft: '8px' }}>
          (約{Math.round((dimensions.length * dimensions.width * dimensions.height) / 1.65)}畳)
        </span>
      </div>

      {/* 部屋比率チェック */}
      <div style={{ 
        marginBottom: '24px', 
        padding: '12px', 
        backgroundColor: roomRatioCheck.isGood ? theme.successBg : theme.warningBg,
        borderRadius: '8px',
        border: `1px solid ${roomRatioCheck.isGood ? theme.success : theme.warning}`,
        marginTop: '16px'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: theme.text }}>
          📐 部屋の比率評価
        </div>
        <div style={{ fontSize: '12px', color: theme.text }}>
          {roomRatioCheck.isGood ? 
            '✅ 良好な比率です！モード問題が比較的少ない部屋です。' :
            '⚠️  問題の多い比率です。黄金比（1:1.6:2.6）に近づけると改善されます。'
          }
        </div>
        <div style={{ fontSize: '11px', color: theme.textSecondary, marginTop: '4px' }}>
          現在の比率: {roomRatioCheck.ratios.map(r => r.toFixed(2)).join(' : ')}
        </div>
      </div>

      {/* 軸モード一覧 */}
      <div style={{ marginBottom: '20px' }}>
        <h5 style={{ 
          fontSize: '16px', 
          fontWeight: 'bold', 
          marginBottom: '12px',
          color: theme.text
        }}>
          🎵 検出された軸モード（300Hz以下）
        </h5>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '8px' 
        }}>
          {allModes.map((mode, index) => {
            const isProblematic = problematicModes.some(p => 
              p.current.frequency === mode.frequency || p.next.frequency === mode.frequency
            )
            
            return (
              <div
                key={index}
                style={{
                  padding: '10px',
                  backgroundColor: isProblematic ? theme.errorBg : theme.surface,
                  border: `1px solid ${isProblematic ? theme.error : theme.border}`,
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              >
                <div style={{ fontWeight: 'bold', color: isProblematic ? theme.error : theme.text }}>
                  {mode.frequency} Hz
                </div>
                <div style={{ color: theme.textSecondary, fontSize: '11px' }}>
                  {mode.axis} {mode.mode}次モード
                </div>
                <div style={{ color: theme.textSecondary, fontSize: '10px' }}>
                  {mode.note}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 問題のあるモード */}
      {problematicModes.length > 0 && (
        <div style={{ 
          marginBottom: '20px',
          padding: '12px',
          backgroundColor: theme.errorBg,
          borderRadius: '8px',
          border: `1px solid ${theme.error}`
        }}>
          <h5 style={{ 
            fontSize: '14px', 
            fontWeight: 'bold', 
            marginBottom: '8px',
            color: theme.error
          }}>
            ⚠️ 特に注意が必要なモード
          </h5>
          {problematicModes.map((prob, index) => (
            <div key={index} style={{ fontSize: '12px', marginBottom: '4px', color: theme.text }}>
              {prob.current.frequency}Hz と {prob.next.frequency}Hz が近接
              （差: {prob.diff.toFixed(1)}Hz）
            </div>
          ))}
          <div style={{ fontSize: '11px', color: theme.textSecondary, marginTop: '8px' }}>
            周波数差5%未満または8Hz未満の近接モードは音が濁る原因となります
          </div>
        </div>
      )}

      {/* 対策のヒント */}
      <div style={{ 
        padding: '16px', 
        backgroundColor: theme.infoBg, 
        borderRadius: '8px',
        border: `1px solid ${isDark ? '#1e40af' : '#c8e6c9'}`
      }}>
        <h5 style={{ 
          fontSize: '14px', 
          fontWeight: 'bold', 
          marginBottom: '12px',
          color: theme.text
        }}>
          💡 対策のヒント
        </h5>
        <div style={{ fontSize: '12px', lineHeight: 1.5, color: theme.text }}>
          <p><strong>最も効果的な対策：</strong></p>
          <ul style={{ margin: '8px 0', paddingLeft: '16px' }}>
            <li>コーナー（特に低い周波数のモード周辺）にベーストラップを配置</li>
            <li>リスナー位置を部屋の中央から避ける（節の位置を避ける）</li>
            <li>家具の配置でモードの腹・節の位置を調整</li>
          </ul>
          <p style={{ fontSize: '11px', color: theme.textSecondary, marginTop: '8px' }}>
            ※ 100Hz以下のモードが特に問題となりやすいです
          </p>
        </div>
      </div>
    </div>
  )
}

export default RoomModeCalculator