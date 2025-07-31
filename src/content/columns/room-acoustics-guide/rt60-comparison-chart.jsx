import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const RT60ComparisonChart = () => {
  const data = [
    {
      frequency: '125Hz',
      classical: 0.55,
      jazz: 0.45,
      homeTheater: 0.35,
      recording: 0.3,
    },
    {
      frequency: '250Hz',
      classical: 0.5,
      jazz: 0.4,
      homeTheater: 0.3,
      recording: 0.25,
    },
    {
      frequency: '500Hz',
      classical: 0.45,
      jazz: 0.35,
      homeTheater: 0.3,
      recording: 0.22,
    },
    {
      frequency: '1kHz',
      classical: 0.43,
      jazz: 0.33,
      homeTheater: 0.28,
      recording: 0.2,
    },
    {
      frequency: '2kHz',
      classical: 0.4,
      jazz: 0.3,
      homeTheater: 0.25,
      recording: 0.18,
    },
    {
      frequency: '4kHz',
      classical: 0.38,
      jazz: 0.28,
      homeTheater: 0.23,
      recording: 0.16,
    },
    {
      frequency: '8kHz',
      classical: 0.35,
      jazz: 0.25,
      homeTheater: 0.2,
      recording: 0.15,
    },
  ]

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="frequency" />
        <YAxis label={{ value: 'RT60 (秒)', angle: -90, position: 'insideLeft' }} />
        <Tooltip formatter={(value) => `${value}秒`} />
        <Legend />
        <Bar dataKey="classical" fill="#8884d8" name="クラシック" />
        <Bar dataKey="jazz" fill="#82ca9d" name="ジャズ・ロック" />
        <Bar dataKey="homeTheater" fill="#ffc658" name="ホームシアター" />
        <Bar dataKey="recording" fill="#ff7c7c" name="録音ブース" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default RT60ComparisonChart