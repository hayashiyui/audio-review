import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'

const SBIREffectChart = () => {
  // 壁からの距離による周波数特性の変化
  const data = [
    { freq: 20, dist30cm: 75, dist60cm: 75, dist100cm: 75, dist150cm: 75 },
    { freq: 30, dist30cm: 76, dist60cm: 76, dist100cm: 76, dist150cm: 76 },
    { freq: 50, dist30cm: 77, dist60cm: 77, dist100cm: 77, dist150cm: 77 },
    { freq: 80, dist30cm: 78, dist60cm: 78, dist100cm: 78, dist150cm: 73 },
    { freq: 100, dist30cm: 79, dist60cm: 79, dist100cm: 79, dist150cm: 74 },
    { freq: 115, dist30cm: 79, dist60cm: 79, dist100cm: 79, dist150cm: 65 }, // 150cmのディップ
    { freq: 130, dist30cm: 79, dist60cm: 79, dist100cm: 79, dist150cm: 72 },
    { freq: 150, dist30cm: 78, dist60cm: 78, dist100cm: 78, dist150cm: 77 },
    { freq: 172, dist30cm: 78, dist60cm: 78, dist100cm: 68, dist150cm: 78 }, // 100cmのディップ
    { freq: 200, dist30cm: 77, dist60cm: 77, dist100cm: 73, dist150cm: 77 },
    { freq: 250, dist30cm: 76, dist60cm: 76, dist100cm: 76, dist150cm: 76 },
    { freq: 286, dist30cm: 75, dist60cm: 67, dist100cm: 75, dist150cm: 75 }, // 60cmのディップ
    { freq: 315, dist30cm: 74, dist60cm: 70, dist100cm: 74, dist150cm: 74 },
    { freq: 400, dist30cm: 73, dist60cm: 73, dist100cm: 73, dist150cm: 73 },
    { freq: 500, dist30cm: 72, dist60cm: 72, dist100cm: 72, dist150cm: 72 },
    { freq: 573, dist30cm: 65, dist60cm: 71, dist100cm: 71, dist150cm: 71 }, // 30cmのディップ
    { freq: 630, dist30cm: 68, dist60cm: 70, dist100cm: 70, dist150cm: 70 },
    { freq: 800, dist30cm: 69, dist60cm: 69, dist100cm: 69, dist150cm: 69 },
    { freq: 1000, dist30cm: 68, dist60cm: 68, dist100cm: 68, dist150cm: 68 },
  ]

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="freq" 
          scale="log" 
          domain={[20, 1000]}
          ticks={[20, 50, 100, 200, 500, 1000]}
        />
        <YAxis domain={[60, 85]} label={{ value: 'SPL (dB)', angle: -90, position: 'insideLeft' }} />
        <Tooltip formatter={(value) => `${value} dB`} />
        <Legend />
        <ReferenceLine y={75} stroke="#666" strokeDasharray="5 5" />
        <Line type="monotone" dataKey="dist30cm" stroke="#e53e3e" name="壁から30cm" strokeWidth={3} dot={false} />
        <Line type="monotone" dataKey="dist60cm" stroke="#3b82f6" name="壁から60cm" strokeWidth={3} dot={false} />
        <Line type="monotone" dataKey="dist100cm" stroke="#10b981" name="壁から100cm" strokeWidth={3} dot={false} />
        <Line type="monotone" dataKey="dist150cm" stroke="#f59e0b" name="壁から150cm" strokeWidth={3} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default SBIREffectChart