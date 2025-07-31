import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const ImprovementProgressChart = () => {
  const data = [
    {
      stage: '初期状態',
      lowFreq: 15,
      midFreq: 8,
      highFreq: 5,
      rt60: 0.9,
    },
    {
      stage: '配置最適化',
      lowFreq: 10,
      midFreq: 6,
      highFreq: 4,
      rt60: 0.9,
    },
    {
      stage: 'ベーストラップ',
      lowFreq: 6,
      midFreq: 5,
      highFreq: 4,
      rt60: 0.7,
    },
    {
      stage: '一次反射処理',
      lowFreq: 5,
      midFreq: 3,
      highFreq: 3,
      rt60: 0.5,
    },
    {
      stage: '拡散材追加',
      lowFreq: 4,
      midFreq: 3,
      highFreq: 2,
      rt60: 0.45,
    },
    {
      stage: 'デジタル補正',
      lowFreq: 3,
      midFreq: 2,
      highFreq: 2,
      rt60: 0.45,
    },
  ]

  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="stage" />
        <YAxis label={{ value: '周波数偏差 (±dB)', angle: -90, position: 'insideLeft' }} />
        <Tooltip formatter={(value) => `±${value} dB`} />
        <Legend />
        <Area type="monotone" dataKey="highFreq" stackId="1" stroke="#ffc658" fill="#ffc658" name="高域 (2k-20kHz)" />
        <Area type="monotone" dataKey="midFreq" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="中域 (200Hz-2kHz)" />
        <Area type="monotone" dataKey="lowFreq" stackId="1" stroke="#8884d8" fill="#8884d8" name="低域 (20-200Hz)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default ImprovementProgressChart