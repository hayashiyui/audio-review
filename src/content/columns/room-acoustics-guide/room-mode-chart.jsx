import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceArea, ReferenceLine
} from 'recharts'

// ルームモード（定在波）の音圧分布を示すチャート
const RoomModeChart = () => {
  // 部屋の短辺（記事の例に合わせて2.7m）
  const roomWidth = 2.7
  
  // 音圧分布データ（一次軸モードの場合）
  const data = Array.from({ length: 55 }, (_, i) => {
    const distance = (i * roomWidth) / 54 // 0 から roomWidth まで
    // 壁際で音圧最大（腹）、中央で最小（節）となるコサイン波
    const pressure = Math.abs(Math.cos((distance / roomWidth) * Math.PI)) * 100
    return {
      distance: parseFloat(distance.toFixed(2)),
      pressure: parseFloat(pressure.toFixed(1))
    }
  })

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ 
          backgroundColor: 'white', 
          border: '1px solid #ccc', 
          borderRadius: '4px', 
          padding: '8px',
          fontSize: '12px'
        }}>
          <p>{`距離: ${label}m`}</p>
          <p>{`相対音圧: ${payload[0].value}%`}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h4 style={{ margin: '16px 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
        ルームモード（一次軸モード）の音圧分布
      </h4>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
        例：短辺2.7mの部屋、63Hz（f = 343 / (2 × 2.7) ≈ 63Hz）
      </div>
      
      <ResponsiveContainer width="100%" height={320}>
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, bottom: 60, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="distance"
            type="number"
            domain={[0, roomWidth]}
            ticks={[0, roomWidth / 4, roomWidth / 2, (3 * roomWidth) / 4, roomWidth]}
            tickFormatter={(value) => `${value.toFixed(1)}m`}
            label={{ value: '壁からの距離 (m)', position: 'insideBottom', offset: -10 }}
          />
          <YAxis 
            domain={[0, 105]}
            label={{ value: '相対音圧 (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
          />

          {/* 音圧の最大値（腹）の位置を示すリファレンスライン */}
          <ReferenceLine 
            x={0} 
            stroke="#ff6b6b" 
            strokeDasharray="5 5" 
            label={{ value: "腹（壁）", position: "top", fontSize: 10 }}
          />
          <ReferenceLine 
            x={roomWidth} 
            stroke="#ff6b6b" 
            strokeDasharray="5 5" 
            label={{ value: "腹（壁）", position: "top", fontSize: 10 }}
          />
          
          {/* 音圧の最小値（節）の位置を示すリファレンスライン */}
          <ReferenceLine 
            x={roomWidth / 2} 
            stroke="#4ecdc4" 
            strokeDasharray="5 5" 
            label={{ value: "節（中央）", position: "bottom", fontSize: 10 }}
          />

          {/* 音圧分布の曲線 */}
          <Line 
            type="monotone" 
            dataKey="pressure" 
            stroke="#2c3e50" 
            strokeWidth={3} 
            dot={false}
            name="音圧分布"
          />

          {/* 腹の領域をハイライト */}
          <ReferenceArea 
            x1={0} 
            x2={roomWidth / 8} 
            fill="#ff6b6b" 
            fillOpacity={0.1}
          />
          <ReferenceArea 
            x1={(7 * roomWidth) / 8} 
            x2={roomWidth} 
            fill="#ff6b6b" 
            fillOpacity={0.1}
          />
          
          {/* 節の領域をハイライト */}
          <ReferenceArea 
            x1={(3 * roomWidth) / 8} 
            x2={(5 * roomWidth) / 8} 
            fill="#4ecdc4" 
            fillOpacity={0.1}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* 説明テキスト */}
      <div style={{ 
        marginTop: '12px', 
        fontSize: '12px', 
        color: '#666',
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