import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts'

// 典型的な問題のある部屋の周波数特性
const FrequencyResponseChart = () => {
  const data = [
    { freq: 20, before: 72, after: 75, target: 75 },
    { freq: 25, before: 74, after: 76, target: 76 },
    { freq: 31.5, before: 78, after: 77, target: 77 },
    { freq: 40, before: 82, after: 78, target: 78 },
    { freq: 50, before: 88, after: 79, target: 79 },
    { freq: 63, before: 92, after: 80, target: 80 },
    { freq: 80, before: 86, after: 79, target: 79 },
    { freq: 100, before: 82, after: 78, target: 78 },
    { freq: 125, before: 79, after: 77, target: 77 },
    { freq: 160, before: 76, after: 76, target: 76 },
    { freq: 200, before: 74, after: 75, target: 75 },
    { freq: 250, before: 73, after: 74, target: 74 },
    { freq: 315, before: 72, after: 73, target: 73 },
    { freq: 400, before: 71, after: 72, target: 72 },
    { freq: 500, before: 70, after: 71, target: 71 },
    { freq: 630, before: 69, after: 70, target: 70 },
    { freq: 800, before: 68, after: 69, target: 69 },
    { freq: 1000, before: 67, after: 68, target: 68 },
    { freq: 1250, before: 66, after: 67, target: 67 },
    { freq: 1600, before: 65, after: 66, target: 66 },
    { freq: 2000, before: 64, after: 65, target: 65 },
    { freq: 2500, before: 62, after: 64, target: 64 },
    { freq: 3150, before: 60, after: 63, target: 63 },
    { freq: 4000, before: 58, after: 62, target: 62 },
    { freq: 5000, before: 56, after: 61, target: 61 },
    { freq: 6300, before: 54, after: 60, target: 60 },
    { freq: 8000, before: 52, after: 59, target: 59 },
    { freq: 10000, before: 50, after: 58, target: 58 },
    { freq: 12500, before: 48, after: 57, target: 57 },
    { freq: 16000, before: 46, after: 56, target: 56 },
    { freq: 20000, before: 44, after: 55, target: 55 },
  ]

  const xTick = (v) => (v >= 1000 ? `${v / 1000}k` : v)

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="freq"
          scale="log"
          domain={[20, 20000]}
          tickFormatter={xTick}
          ticks={[20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]}
        />
        <YAxis domain={[40, 95]} label={{ value: 'SPL (dB)', angle: -90, position: 'insideLeft' }} />
        <Tooltip formatter={(v) => `${v} dB`} />
        <Legend />
        <ReferenceLine y={75} stroke="#666" strokeDasharray="5 5" label="Reference" />
        <Line type="monotone" dataKey="before" stroke="#ff6b6b" name="処理前" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="after" stroke="#4ecdc4" name="処理後" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="target" stroke="#666" name="目標" strokeDasharray="5 5" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default FrequencyResponseChart
