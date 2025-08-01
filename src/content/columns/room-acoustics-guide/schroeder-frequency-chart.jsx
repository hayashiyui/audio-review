import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ReferenceArea
} from 'recharts'

// シュレーダー周波数による音響領域の分類を示すチャート
const SchroederFrequencyChart = () => {
  // シュレーダー周波数（記事の例：40m³、RT60=0.4sで約200Hz）
  const schroederFreq = 200
  
  // 周波数軸のデータ（境界線表示用）
  const data = [
    { freq: 20, value: 1 },
    { freq: 25, value: 1 },
    { freq: 31.5, value: 1 },
    { freq: 40, value: 1 },
    { freq: 50, value: 1 },
    { freq: 63, value: 1 },
    { freq: 80, value: 1 },
    { freq: 100, value: 1 },
    { freq: 125, value: 1 },
    { freq: 160, value: 1 },
    { freq: 200, value: 1 },
    { freq: 250, value: 1 },
    { freq: 315, value: 1 },
    { freq: 400, value: 1 },
    { freq: 500, value: 1 },
    { freq: 630, value: 1 },
    { freq: 800, value: 1 },
    { freq: 1000, value: 1 },
    { freq: 1250, value: 1 },
    { freq: 1600, value: 1 },
    { freq: 2000, value: 1 },
    { freq: 2500, value: 1 },
    { freq: 3150, value: 1 },
    { freq: 4000, value: 1 },
    { freq: 5000, value: 1 },
    { freq: 6300, value: 1 },
    { freq: 8000, value: 1 },
    { freq: 10000, value: 1 },
    { freq: 12500, value: 1 },
    { freq: 16000, value: 1 },
    { freq: 20000, value: 1 }
  ]

  // X軸のフォーマッター
  const xTickFormatter = (value) => {
    if (value >= 1000) {
      return `${value / 1000}k`
    }
    return value
  }

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const isModal = label < schroederFreq
      const region = isModal ? '波の領域（モード支配）' : '光線の領域（反射支配）'
      const approach = isModal ? 'ベーストラップ等のモード対策' : '吸音・拡散による反射音制御'
      
      return (
        <div style={{ 
          backgroundColor: 'white', 
          border: '1px solid #ccc', 
          borderRadius: '4px', 
          padding: '12px',
          fontSize: '12px',
          maxWidth: '250px'
        }}>
          <p><strong>{label} Hz</strong></p>
          <p><strong>領域:</strong> {region}</p>
          <p><strong>対策:</strong> {approach}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h4 style={{ margin: '16px 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
        シュレーダー周波数による音響解析領域の分類
      </h4>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
        例：容積40m³（約10畳）、RT60=0.4秒の部屋 → fs = 200Hz
      </div>
      
      <ResponsiveContainer width="100%" height={320}>
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, bottom: 60, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="freq"
            type="number"
            scale="log"
            domain={[20, 20000]}
            tickFormatter={xTickFormatter}
            ticks={[20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]}
            label={{ value: '周波数 (Hz)', position: 'insideBottom', offset: -10 }}
          />
          <YAxis 
            domain={[0, 1.2]} 
            hide 
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* 波の領域（モード支配）- 低周波数帯 */}
          <ReferenceArea 
            x1={20} 
            x2={schroederFreq} 
            fill="#ff6b6b" 
            fillOpacity={0.3}
            stroke="none"
          />
          
          {/* 光線の領域（反射支配）- 高周波数帯 */}
          <ReferenceArea 
            x1={schroederFreq} 
            x2={20000} 
            fill="#4ecdc4" 
            fillOpacity={0.3}
            stroke="none"
          />

          {/* シュレーダー周波数の境界線 */}
          <ReferenceLine 
            x={schroederFreq} 
            stroke="#2c3e50" 
            strokeWidth={3}
            strokeDasharray="8 4"
            label={{ 
              value: `シュレーダー周波数 (${schroederFreq}Hz)`, 
              position: "topRight", 
              fontSize: 11,
              fill: "#2c3e50"
            }}
          />

          {/* 隠し線（データ構造のため） */}
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="transparent" 
            dot={false}
            legendType="none"
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* 手動でレジェンドを追加 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '20px', 
        marginTop: '8px',
        fontSize: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            backgroundColor: '#ff6b6b', 
            opacity: 0.6,
            marginRight: '6px' 
          }}></div>
          <span>波の領域（モード支配）</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            backgroundColor: '#4ecdc4', 
            opacity: 0.6,
            marginRight: '6px' 
          }}></div>
          <span>光線の領域（反射支配）</span>
        </div>
      </div>
      
      {/* 説明テキスト */}
      <div style={{ 
        marginTop: '12px', 
        fontSize: '12px', 
        color: '#666',
        textAlign: 'left',
        maxWidth: '600px',
        margin: '12px auto 0'
      }}>
        <p><strong>波の領域（低域）:</strong> 定在波が支配的。ベーストラップ等のモード対策が有効</p>
        <p><strong>光線の領域（高域）:</strong> 反射音が支配的。吸音・拡散による反射音制御が有効</p>
        <p><strong>計算式:</strong> fs = 2000 × √(RT60 / V)  [Hz]</p>
      </div>
    </div>
  )
}

export default SchroederFrequencyChart