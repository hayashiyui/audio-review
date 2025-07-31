import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const AbsorptionComparisonChart = () => {
  const data = [
    {
      frequency: '125Hz',
      グラスウール5cm: 0.15,
      グラスウール10cm: 0.35,
      スーパーチャンク: 0.65,
      薄いカーテン: 0.05,
    },
    {
      frequency: '250Hz',
      グラスウール5cm: 0.45,
      グラスウール10cm: 0.65,
      スーパーチャンク: 0.85,
      薄いカーテン: 0.1,
    },
    {
      frequency: '500Hz',
      グラスウール5cm: 0.75,
      グラスウール10cm: 0.85,
      スーパーチャンク: 0.95,
      薄いカーテン: 0.15,
    },
    {
      frequency: '1kHz',
      グラスウール5cm: 0.85,
      グラスウール10cm: 0.95,
      スーパーチャンク: 0.98,
      薄いカーテン: 0.25,
    },
    {
      frequency: '2kHz',
      グラスウール5cm: 0.9,
      グラスウール10cm: 0.98,
      スーパーチャンク: 0.99,
      薄いカーテン: 0.35,
    },
    {
      frequency: '4kHz',
      グラスウール5cm: 0.95,
      グラスウール10cm: 0.99,
      スーパーチャンク: 0.99,
      薄いカーテン: 0.4,
    },
  ]

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="frequency" />
        <YAxis label={{ value: '吸音率', angle: -90, position: 'insideLeft' }} domain={[0, 1]} />
        <Tooltip formatter={(value) => `${(value * 100).toFixed(0)}%`} />
        <Legend />
        <Bar dataKey="グラスウール5cm" fill="#4285f4" name="グラスウール5cm" />
        <Bar dataKey="グラスウール10cm" fill="#34a853" name="グラスウール10cm" />
        <Bar dataKey="スーパーチャンク" fill="#ffc658" name="スーパーチャンク" />
        <Bar dataKey="薄いカーテン" fill="#ff7c7c" name="薄いカーテン" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default AbsorptionComparisonChart