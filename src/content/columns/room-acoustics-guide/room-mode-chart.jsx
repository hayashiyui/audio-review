import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceArea, ReferenceLine
} from 'recharts'

// ルームモード（定在波）の音圧分布を示すチャート
const RoomModeChart = () => {
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
    background: isDark ? '#1a1a1a' : 'transparent',
    surface: isDark ? '#2d2d2d' : 'white',
    text: isDark ? '#e0e0e0' : '#2c3e50',
    textSecondary: isDark ? '#b0b0b0' : '#666',
    border: isDark ? '#404040' : '#e0e0e0',
    grid: isDark ? '#404040' : '#f0f0f0',
    line: isDark ? '#60a5fa' : '#2c3e50',
    referenceArea: isDark ? '#374151' : '#f3f4f6'
  }
  // 部屋の短辺（記事の例に合わせて2.7m）
  const roomWidth = 2.7
  
  // 音圧分布データ（一次軸モードの場合）
  const data = Array.from({ length: 55 }, (_, i) => {
    const distance = (i * roomWidth) / 54 // 0 から roomWidth まで
    // 壁際で音圧最大（腹）、中央で最小（節）となるコサイン波
    const pressureRaw = Math.cos((distance / roomWidth) * Math.PI)
    const pressure = Math.abs(pressureRaw) * 100 // 表示用は絶対値
    const phase = pressureRaw >= 0 ? '+' : '-' // 位相情報
    return {
      distance: parseFloat(distance.toFixed(2)),
      pressure: parseFloat(pressure.toFixed(1)),
      phase: phase,
      pressureWithSign: parseFloat((pressureRaw * 100).toFixed(1))
    }
  })

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div style={{ 
          backgroundColor: theme.surface, 
          border: `1px solid ${theme.border}`, 
          borderRadius: '4px', 
          padding: '8px',
          fontSize: '12px',
          color: theme.text
        }}>
          <p>{`距離: ${label}m`}</p>
          <p>{`音圧振幅: ${data.pressureWithSign}%`}</p>
          <p>{`位相: ${data.phase} (${data.phase === '+' ? '同相' : '逆相'})`}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ fontFamily: 'sans-serif', textAlign: 'center', backgroundColor: theme.background, padding: '20px', borderRadius: '12px' }}>
      <h4 style={{ margin: '16px 0 8px 0', fontSize: '16px', fontWeight: 'bold', color: theme.text }}>
        ルームモード（一次軸モード）の音圧分布
      </h4>
      <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '12px' }}>
        例：短辺2.7mの部屋、63Hz（f = 343 / (2 × 2.7) ≈ 63Hz）
      </div>
      
      <ResponsiveContainer width="100%" height={320}>
        <LineChart
          data={data}
          margin={{ top: 40, right: 40, bottom: 70, left: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
          <XAxis
            dataKey="distance"
            type="number"
            domain={[0, roomWidth]}
            ticks={[0, roomWidth / 4, roomWidth / 2, (3 * roomWidth) / 4, roomWidth]}
            tickFormatter={(value) => `${value.toFixed(1)}m`}
            tick={{ fill: theme.text, fontSize: 12 }}
            label={{ value: '壁からの距離 (m)', position: 'insideBottom', offset: -10, style: { fill: theme.text } }}
          />
          <YAxis 
            domain={[0, 105]}
            tick={{ fill: theme.text, fontSize: 12 }}
            label={{ value: '音圧振幅 (%)', angle: -90, position: 'insideLeft', style: { fill: theme.text } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: theme.text }}
          />

          {/* 音圧の最大値（腹）の位置を示すリファレンスライン */}
          <ReferenceLine 
            x={0} 
            stroke={isDark ? "#f87171" : "#ff6b6b"} 
            strokeDasharray="5 5" 
            label={{ value: "腹（壁）", position: "top", fontSize: 10, fill: theme.text }}
          />
          <ReferenceLine 
            x={roomWidth} 
            stroke={isDark ? "#f87171" : "#ff6b6b"} 
            strokeDasharray="5 5" 
            label={{ value: "腹（壁）", position: "top", fontSize: 10, fill: theme.text }}
          />
          
          {/* 音圧の最小値（節）の位置を示すリファレンスライン */}
          <ReferenceLine 
            x={roomWidth / 2} 
            stroke={isDark ? "#22d3ee" : "#4ecdc4"} 
            strokeDasharray="5 5" 
            label={{ value: "節（中央）", position: "topLeft", fontSize: 10, fill: theme.text, offset: 10 }}
          />

          {/* 音圧分布の曲線 */}
          <Line 
            type="monotone" 
            dataKey="pressure" 
            stroke={theme.line} 
            strokeWidth={3} 
            dot={false}
            name="音圧分布"
          />

          {/* 腹の領域をハイライト */}
          <ReferenceArea 
            x1={0} 
            x2={roomWidth / 8} 
            fill={isDark ? "#f87171" : "#ff6b6b"} 
            fillOpacity={isDark ? 0.2 : 0.1}
          />
          <ReferenceArea 
            x1={(7 * roomWidth) / 8} 
            x2={roomWidth} 
            fill={isDark ? "#f87171" : "#ff6b6b"} 
            fillOpacity={isDark ? 0.2 : 0.1}
          />
          
          {/* 節の領域をハイライト */}
          <ReferenceArea 
            x1={(3 * roomWidth) / 8} 
            x2={(5 * roomWidth) / 8} 
            fill={isDark ? "#22d3ee" : "#4ecdc4"} 
            fillOpacity={isDark ? 0.2 : 0.1}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* 説明テキスト */}
      <div style={{ 
        marginTop: '12px', 
        fontSize: '12px', 
        color: theme.textSecondary,
        textAlign: 'left',
        maxWidth: '600px',
        margin: '12px auto 0'
      }}>
        <p><strong>腹（壁際）:</strong> 音圧が最大となる位置。低音がブーストされて聴こえる</p>
        <p><strong>節（中央）:</strong> 音圧が最小となる位置。低音がキャンセルされて聴こえない</p>
        <p><strong>対策:</strong> リスナー位置を節から避ける、ベーストラップで定在波を減衰させる</p>
      </div>
    </div>
  )
}

export default RoomModeChart