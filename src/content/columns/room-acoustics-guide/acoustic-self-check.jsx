import { useState, useEffect } from 'react'

// 5分音響問題セルフチェックコンポーネント
const AcousticSelfCheck = () => {
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
    background: isDark ? '#1a1a1a' : '#f8f9fa',
    surface: isDark ? '#2d2d2d' : 'white',
    text: isDark ? '#e0e0e0' : '#2c3e50',
    textSecondary: isDark ? '#b0b0b0' : '#666',
    border: isDark ? '#404040' : '#e9ecef',
    success: isDark ? '#10b981' : '#27ae60',
    warning: isDark ? '#f59e0b' : '#f39c12',
    error: isDark ? '#ef4444' : '#e74c3c',
    info: isDark ? '#3b82f6' : '#007bff',
    successBg: isDark ? '#064e3b' : '#d4edda',
    warningBg: isDark ? '#78350f' : '#fff3cd',
    errorBg: isDark ? '#7f1d1d' : '#ffebee',
    infoBg: isDark ? '#1e3a8a' : '#e8f4fd',
    primaryButton: isDark ? '#3b82f6' : '#007bff',
    secondaryButton: isDark ? '#6b7280' : '#6c757d'
  }
  const [currentStep, setCurrentStep] = useState(0)
  const [results, setResults] = useState({})
  const [isCompleted, setIsCompleted] = useState(false)

  // テスト項目の定義
  const tests = [
    {
      id: 'flutter',
      title: 'フラッターエコーテスト',
      description: '平行な壁面での音の往復を確認',
      icon: '👏',
      duration: '30秒',
      instructions: [
        '部屋の中央付近に立つ',
        '手を頭上で強く1回手拍子する',
        '「キンキンキン…」という金属的な響きが聞こえるか確認',
        '壁に向かって手拍子し、横方向でも確認'
      ],
      options: [
        { value: 'none', label: '全く聞こえない', score: 0, color: '#27ae60' },
        { value: 'slight', label: 'わずかに聞こえる', score: 1, color: '#f39c12' },
        { value: 'moderate', label: 'はっきり聞こえる', score: 2, color: '#e74c3c' },
        { value: 'severe', label: '非常に響く', score: 3, color: '#8e44ad' }
      ]
    },
    {
      id: 'bass',
      title: '低音の偏在テスト',
      description: '定在波による低音の不均一を確認',
      icon: '🎵',
      duration: '90秒',
      instructions: [
        'ベースが効いた楽曲を再生（推奨：40-80Hzが含まれる楽曲）',
        '部屋の四隅に順番に移動して聴き比べ',
        'コーナー付近と部屋の中央での低音の違いを確認',
        '壁際と中央での低音レベルの違いをチェック'
      ],
      options: [
        { value: 'none', label: 'ほとんど違いなし', score: 0, color: '#27ae60' },
        { value: 'slight', label: 'わずかに違いあり', score: 1, color: '#f39c12' },
        { value: 'moderate', label: 'はっきりした違い', score: 2, color: '#e74c3c' },
        { value: 'severe', label: '全く違う音', score: 3, color: '#8e44ad' }
      ]
    },
    {
      id: 'imaging',
      title: '音像・定位テスト',
      description: '初期反射音による音像のぼやけを確認',
      icon: '🎯',
      duration: '60秒',
      instructions: [
        'ボーカル楽曲またはモノラル音源を再生',
        'リスニングポジションで音像の位置を確認',
        '頭を左右に軽く動かして音像の安定性をチェック',
        '音像がぼやけたり、複数に分かれて聞こえないか確認'
      ],
      options: [
        { value: 'sharp', label: 'シャープで安定', score: 0, color: '#27ae60' },
        { value: 'slight', label: 'わずかにぼやける', score: 1, color: '#f39c12' },
        { value: 'blur', label: 'ぼやけて定位不明', score: 2, color: '#e74c3c' },
        { value: 'multiple', label: '複数に分裂', score: 3, color: '#8e44ad' }
      ]
    },
    {
      id: 'reverb',
      title: '残響・響きテスト',
      description: '部屋の残響特性を確認',
      icon: '🌊',
      duration: '45秒',
      instructions: [
        '手拍子を1回強く打つ',
        '音が消えるまでの時間を体感する',
        '響きの質（自然 vs 不自然）を評価',
        '楽曲再生時の残響感も確認'
      ],
      options: [
        { value: 'natural', label: '自然で適度', score: 0, color: '#27ae60' },
        { value: 'short', label: 'やや短く感じる', score: 1, color: '#f39c12' },
        { value: 'long', label: 'やや長く感じる', score: 1, color: '#f39c12' },
        { value: 'unnatural', label: '不自然・不快', score: 3, color: '#8e44ad' }
      ]
    },
    {
      id: 'frequency',
      title: '周波数バランステスト',
      description: '特定の周波数の強調・欠損を確認',
      icon: '📊',
      duration: '60秒',
      instructions: [
        'よく知っている楽曲を再生',
        '低音・中音・高音のバランスを評価',
        '特定の音程だけが強調されていないか確認',
        '楽器の音色が自然に聞こえるかチェック'
      ],
      options: [
        { value: 'balanced', label: 'バランス良好', score: 0, color: '#27ae60' },
        { value: 'slight', label: 'わずかな偏り', score: 1, color: '#f39c12' },
        { value: 'noticeable', label: '明らかな偏り', score: 2, color: '#e74c3c' },
        { value: 'severe', label: '大きく歪んだ音', score: 3, color: '#8e44ad' }
      ]
    }
  ]

  // 結果の処理
  const handleAnswer = (testId, answer) => {
    const newResults = { ...results, [testId]: answer }
    setResults(newResults)
    
    if (currentStep < tests.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      setIsCompleted(true)
    }
  }

  // 総合スコアの計算
  const calculateTotalScore = () => {
    return Object.values(results).reduce((sum, result) => sum + (result?.score || 0), 0)
  }

  // 問題分析
  const analyzeProblems = () => {
    const problems = []
    const recommendations = []

    if (results.flutter?.score >= 2) {
      problems.push('フラッターエコー（金属的な響き）')
      recommendations.push('平行な壁面に吸音材または拡散材を配置')
    }

    if (results.bass?.score >= 2) {
      problems.push('定在波による低音の偏在')
      recommendations.push('コーナーにベーストラップを設置、リスニング位置の調整')
    }

    if (results.imaging?.score >= 2) {
      problems.push('音像のぼやけ・定位の不安定')
      recommendations.push('初期反射点への吸音処理、スピーカー角度の調整')
    }

    if (results.reverb?.score >= 2) {
      problems.push('不適切な残響特性')
      recommendations.push('全体的な吸音・拡散バランスの見直し')
    }

    if (results.frequency?.score >= 2) {
      problems.push('周波数特性の不均一')
      recommendations.push('部屋の音響測定とEQ調整の検討')
    }

    return { problems, recommendations }
  }

  // リセット機能
  const resetTest = () => {
    setCurrentStep(0)
    setResults({})
    setIsCompleted(false)
  }

  // 結果表示
  if (isCompleted) {
    const totalScore = calculateTotalScore()
    const maxScore = tests.length * 3
    const { problems, recommendations } = analyzeProblems()
    
    let overallRating = ''
    let ratingColor = ''
    let ratingIcon = ''
    
    if (totalScore <= 2) {
      overallRating = '良好'
      ratingColor = '#27ae60'
      ratingIcon = '✅'
    } else if (totalScore <= 5) {
      overallRating = '軽微な問題あり'
      ratingColor = '#f39c12'
      ratingIcon = '⚠️'
    } else if (totalScore <= 10) {
      overallRating = '改善が必要'
      ratingColor = '#e74c3c'
      ratingIcon = '🔧'
    } else {
      overallRating = '大幅な改善が必要'
      ratingColor = '#8e44ad'
      ratingIcon = '🚨'
    }

    return (
      <div style={{ 
        fontFamily: 'sans-serif', 
        maxWidth: '700px', 
        margin: '0 auto',
        backgroundColor: theme.background,
        padding: '24px',
        borderRadius: '12px',
        border: `1px solid ${theme.border}`
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h4 style={{ 
            fontSize: '20px', 
            fontWeight: 'bold',
            color: theme.text,
            marginBottom: '8px'
          }}>
            🎉 セルフチェック完了！
          </h4>
          <div style={{ fontSize: '14px', color: theme.textSecondary }}>
            お疲れさまでした。結果をご確認ください。
          </div>
        </div>

        {/* 総合評価 */}
        <div style={{ 
          padding: '20px', 
          backgroundColor: theme.surface,
          borderRadius: '10px',
          border: `3px solid ${ratingColor}`,
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>{ratingIcon}</div>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: ratingColor,
            marginBottom: '8px'
          }}>
            {overallRating}
          </div>
          <div style={{ fontSize: '14px', color: theme.textSecondary }}>
            スコア: {totalScore} / {maxScore}
          </div>
        </div>

        {/* 検出された問題 */}
        {problems.length > 0 && (
          <div style={{ 
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: theme.warningBg,
            borderRadius: '8px',
            border: `1px solid ${theme.border}`
          }}>
            <h5 style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              marginBottom: '12px',
              color: theme.warning
            }}>
              🔍 検出された主な問題
            </h5>
            <ul style={{ margin: 0, paddingLeft: '20px', color: theme.text }}>
              {problems.map((problem, index) => (
                <li key={index} style={{ fontSize: '14px', marginBottom: '4px' }}>
                  {problem}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 推奨対策 */}
        {recommendations.length > 0 && (
          <div style={{ 
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: theme.successBg,
            borderRadius: '8px',
            border: `1px solid ${theme.border}`
          }}>
            <h5 style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              marginBottom: '12px',
              color: theme.success
            }}>
              💡 推奨される対策
            </h5>
            <ul style={{ margin: 0, paddingLeft: '20px', color: theme.text }}>
              {recommendations.map((rec, index) => (
                <li key={index} style={{ fontSize: '14px', marginBottom: '4px' }}>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 次のステップ */}
        <div style={{ 
          padding: '16px',
          backgroundColor: theme.infoBg,
          borderRadius: '8px',
          border: `1px solid ${theme.border}`,
          marginBottom: '20px'
        }}>
          <h5 style={{ 
            fontSize: '16px', 
            fontWeight: 'bold', 
            marginBottom: '12px',
            color: theme.info
          }}>
            📋 次のステップ
          </h5>
          <div style={{ fontSize: '14px', lineHeight: 1.5, color: theme.text }}>
            {totalScore <= 2 ? 
              '素晴らしい音響環境です！微調整で更なる向上を目指しましょう。' :
              'まずは最も問題となっている項目から対策を始めることをお勧めします。このガイドの第5部「実践的音響処理ガイド」で具体的な改善方法をご確認ください。'
            }
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={resetTest}
            style={{
              padding: '12px 24px',
              backgroundColor: theme.textSecondary,
              color: theme.surface,
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🔄 もう一度テストする
          </button>
        </div>
      </div>
    )
  }

  // テスト進行中の表示
  const currentTest = tests[currentStep]
  const progress = ((currentStep + 1) / tests.length) * 100

  return (
    <div style={{ 
      fontFamily: 'sans-serif', 
      maxWidth: '700px', 
      margin: '0 auto',
      backgroundColor: theme.background,
      padding: '24px',
      borderRadius: '12px',
      border: `1px solid ${theme.border}`
    }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h4 style={{ 
          fontSize: '20px', 
          fontWeight: 'bold',
          color: theme.text,
          marginBottom: '8px'
        }}>
          🔍 5分音響問題セルフチェック
        </h4>
        <div style={{ fontSize: '14px', color: theme.textSecondary, marginBottom: '16px' }}>
          あなたの部屋の音響問題を簡単にチェックしましょう
        </div>
        
        {/* プログレスバー */}
        <div style={{ 
          width: '100%', 
          height: '8px', 
          backgroundColor: theme.border, 
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '12px'
        }}>
          <div style={{ 
            width: `${progress}%`, 
            height: '100%', 
            backgroundColor: theme.info,
            transition: 'width 0.3s ease'
          }}></div>
        </div>
      </div>

      {/* 現在のテスト */}
      <div style={{ 
        backgroundColor: theme.surface,
        padding: '24px',
        borderRadius: '10px',
        border: `1px solid ${theme.border}`,
        marginBottom: '20px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>
            {currentTest.icon}
          </div>
          <h5 style={{ 
            fontSize: '18px', 
            fontWeight: 'bold',
            color: theme.text,
            marginBottom: '8px'
          }}>
            {currentTest.title}
          </h5>
          <div style={{ fontSize: '14px', color: theme.textSecondary, marginBottom: '8px' }}>
            {currentTest.description}
          </div>
        </div>

        {/* 手順 */}
        <div style={{ marginBottom: '24px' }}>
          <h6 style={{ 
            fontSize: '14px', 
            fontWeight: 'bold',
            marginBottom: '12px',
            color: theme.text
          }}>
            📝 手順
          </h6>
          <ol style={{ margin: 0, paddingLeft: '20px', color: theme.text }}>
            {currentTest.instructions.map((instruction, index) => (
              <li key={index} style={{ 
                fontSize: '13px', 
                marginBottom: '6px',
                lineHeight: 1.4
              }}>
                {instruction}
              </li>
            ))}
          </ol>
        </div>

        {/* 回答選択肢 */}
        <div>
          <h6 style={{ 
            fontSize: '14px', 
            fontWeight: 'bold',
            marginBottom: '12px',
            color: theme.text
          }}>
            💬 結果はいかがでしたか？
          </h6>
          <div style={{ display: 'grid', gap: '8px' }}>
            {currentTest.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(currentTest.id, option)}
                style={{
                  padding: '12px 16px',
                  backgroundColor: theme.surface,
                  border: `2px solid ${option.color}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  fontWeight: '500',
                  color: theme.text
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = option.color
                  e.target.style.color = 'white'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = theme.surface
                  e.target.style.color = theme.text
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* スキップボタン */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={() => handleAnswer(currentTest.id, { score: 0 })}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: theme.textSecondary,
            border: `1px solid ${theme.textSecondary}`,
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          このテストをスキップ
        </button>
      </div>
    </div>
  )
}

export default AcousticSelfCheck