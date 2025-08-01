import { useState } from 'react'

// ルームモード計算機コンポーネント
const RoomModeCalculator = () => {
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
      if (freqDiff < 10) { // 10Hz以内に複数のモードがある場合
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
    
    // Bolt's ratios やGolden ratioに近いかチェック
    const goldenRatio = 1.618
    const boltRatio1 = 1.6
    const boltRatio2 = 2.5
    
    const isGoodRatio = (
      Math.abs(ratio1 - goldenRatio) < 0.2 ||
      Math.abs(ratio1 - boltRatio1) < 0.2 ||
      Math.abs(ratio2 - boltRatio2) < 0.3
    )
    
    return { isGood: isGoodRatio, ratios: [ratio1, ratio2, ratio3] }
  }

  const roomRatioCheck = checkRoomRatio()

  return (
    <div style={{ 
      fontFamily: 'sans-serif', 
      maxWidth: '700px', 
      margin: '0 auto',
      backgroundColor: '#f8f9fa',
      padding: '20px',
      borderRadius: '12px',
      border: '1px solid #e9ecef'
    }}>
      <h4 style={{ 
        margin: '0 0 16px 0', 
        fontSize: '18px', 
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#2c3e50'
      }}>
        🧮 あなたの部屋のルームモード計算機
      </h4>
      
      <div style={{ fontSize: '13px', color: '#666', marginBottom: '20px', textAlign: 'center' }}>
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
          { key: 'length', label: '奥行き', color: '#3498db' },
          { key: 'width', label: '幅', color: '#e74c3c' },
          { key: 'height', label: '高さ', color: '#27ae60' }
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
                backgroundColor: 'white'
              }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              (m)
            </div>
          </div>
        ))}
      </div>

      {/* 部屋比率チェック */}
      <div style={{ 
        marginBottom: '24px', 
        padding: '12px', 
        backgroundColor: roomRatioCheck.isGood ? '#d4edda' : '#fff3cd',
        borderRadius: '8px',
        border: `1px solid ${roomRatioCheck.isGood ? '#c3e6cb' : '#ffeeba'}`
      }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
          📐 部屋の比率評価
        </div>
        <div style={{ fontSize: '12px' }}>
          {roomRatioCheck.isGood ? 
            '✅ 良好な比率です！モード問題が比較的少ない部屋です。' :
            '⚠️  問題の多い比率です。黄金比（1:1.6:2.6）に近づけると改善されます。'
          }
        </div>
        <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
          現在の比率: {roomRatioCheck.ratios.map(r => r.toFixed(2)).join(' : ')}
        </div>
      </div>

      {/* 軸モード一覧 */}
      <div style={{ marginBottom: '20px' }}>
        <h5 style={{ 
          fontSize: '16px', 
          fontWeight: 'bold', 
          marginBottom: '12px',
          color: '#2c3e50'
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
                  backgroundColor: isProblematic ? '#ffebee' : 'white',
                  border: `1px solid ${isProblematic ? '#ffcdd2' : '#e0e0e0'}`,
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              >
                <div style={{ fontWeight: 'bold', color: isProblematic ? '#d32f2f' : '#333' }}>
                  {mode.frequency} Hz
                </div>
                <div style={{ color: '#666', fontSize: '11px' }}>
                  {mode.axis} {mode.mode}次モード
                </div>
                <div style={{ color: '#666', fontSize: '10px' }}>
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
          backgroundColor: '#ffebee',
          borderRadius: '8px',
          border: '1px solid #ffcdd2'
        }}>
          <h5 style={{ 
            fontSize: '14px', 
            fontWeight: 'bold', 
            marginBottom: '8px',
            color: '#d32f2f'
          }}>
            ⚠️ 特に注意が必要なモード
          </h5>
          {problematicModes.map((prob, index) => (
            <div key={index} style={{ fontSize: '12px', marginBottom: '4px' }}>
              {prob.current.frequency}Hz と {prob.next.frequency}Hz が近接
              （差: {prob.diff.toFixed(1)}Hz）
            </div>
          ))}
          <div style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>
            近接したモードは音が濁って聴こえる原因となります
          </div>
        </div>
      )}

      {/* 対策のヒント */}
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#e8f5e8', 
        borderRadius: '8px',
        border: '1px solid #c8e6c9'
      }}>
        <h5 style={{ 
          fontSize: '14px', 
          fontWeight: 'bold', 
          marginBottom: '12px',
          color: '#2e7d32'
        }}>
          💡 対策のヒント
        </h5>
        <div style={{ fontSize: '12px', lineHeight: 1.5 }}>
          <p><strong>最も効果的な対策：</strong></p>
          <ul style={{ margin: '8px 0', paddingLeft: '16px' }}>
            <li>コーナー（特に低い周波数のモード周辺）にベーストラップを配置</li>
            <li>リスナー位置を部屋の中央から避ける（節の位置を避ける）</li>
            <li>家具の配置でモードの腹・節の位置を調整</li>
          </ul>
          <p style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>
            ※ 100Hz以下のモードが特に問題となりやすいです
          </p>
        </div>
      </div>
    </div>
  )
}

export default RoomModeCalculator