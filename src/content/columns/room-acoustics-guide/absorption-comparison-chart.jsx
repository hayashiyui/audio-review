import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from 'recharts'

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
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="frequency" />
        <PolarRadiusAxis angle={90} domain={[0, 1]} />
        <Radar name="グラスウール5cm" dataKey="グラスウール5cm" stroke="#4285f4" fill="#4285f4" fillOpacity={0.6} />
        <Radar name="グラスウール10cm" dataKey="グラスウール10cm" stroke="#34a853" fill="#34a853" fillOpacity={0.6} />
        <Radar name="スーパーチャンク" dataKey="スーパーチャンク" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
        <Radar name="薄いカーテン" dataKey="薄いカーテン" stroke="#ff7c7c" fill="#ff7c7c" fillOpacity={0.6} />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  )
}

export default AbsorptionComparisonChart