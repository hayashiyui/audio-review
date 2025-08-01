import { useState, useEffect } from 'react'

// 音の伝搬経路を示すSVGチャート
const SoundPropagationChart = () => {
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
    text: isDark ? '#f3f4f6' : '#2c3e50',
    textSecondary: isDark ? '#d1d5db' : '#666',
    border: isDark ? '#404040' : '#e0e0e0',
    gridLight: isDark ? '#333' : '#f0f0f0',
    gridDark: isDark ? '#404040' : '#333',
    directSound: isDark ? '#60a5fa' : '#2c3e50',
    earlyReflection: isDark ? '#f87171' : '#ff6b6b',
    lateReflection: isDark ? '#a3a3a3' : '#95a5a6',
    speaker: isDark ? '#ef4444' : '#e74c3c',
    listener: isDark ? '#3b82f6' : '#3498db',
    reflection: isDark ? '#fbbf24' : '#feca57'
  }
  // SVGの寸法とスケール
  const svgWidth = 600
  const svgHeight = 400
  const margin = { top: 40, right: 40, bottom: 80, left: 60 }
  const chartWidth = svgWidth - margin.left - margin.right
  const chartHeight = svgHeight - margin.top - margin.bottom
  
  // 部屋のサイズ (m)
  const room = { width: 8, height: 5 }
  
  // 座標変換関数
  const scaleX = (x) => margin.left + (x / room.width) * chartWidth
  // scaleY: SVGは上が原点なので、部屋座標(下が原点)を上下反転
  const scaleY = (y) => margin.top + ((room.height - y) / room.height) * chartHeight
  
  // スピーカーとリスナーの位置
  const speaker = { x: 1.5, y: 2.5 }
  const listener = { x: 6, y: 2.5 }
  
  // 反射点
  const ceilingReflection = { x: 3.5, y: 5 }
  const leftWallReflection = { x: 0, y: 1.8 }
  const rightWallReflection = { x: 8, y: 3.2 }
  const floorReflection = { x: 4.5, y: 0 }
  
  // 矢印マーカーの定義
  const ArrowMarker = ({ id, color }) => (
    <defs>
      <marker
        id={id}
        markerWidth="10"
        markerHeight="10"
        refX="8"
        refY="3"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M0,0 L0,6 L9,3 z" fill={color} />
      </marker>
    </defs>
  )
  
  // 音の経路線コンポーネント
  const SoundPath = ({ points, color, strokeWidth, strokeDasharray, label, markerEnd }) => {
    const pathData = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${scaleX(point.x)} ${scaleY(point.y)}`
    ).join(' ')
    
    return (
      <g>
        <path
          d={pathData}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          fill="none"
          markerEnd={markerEnd}
        />
      </g>
    )
  }

  return (
    <div style={{ fontFamily: 'sans-serif', textAlign: 'center', backgroundColor: theme.background, padding: '20px', borderRadius: '12px' }}>
      <h4 style={{ margin: '16px 0 8px 0', fontSize: '16px', fontWeight: 'bold', color: theme.text }}>
        音の伝搬経路（3つの音要素）
      </h4>
      <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '16px' }}>
        リスニングルーム内での音の伝わり方
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg width={svgWidth} height={svgHeight} style={{ border: `1px solid ${theme.border}`, borderRadius: '8px', backgroundColor: theme.surface }}>
          {/* 矢印マーカーの定義 */}
          <ArrowMarker id="directArrow" color={theme.directSound} />
          <ArrowMarker id="earlyArrow" color={theme.earlyReflection} />
          <ArrowMarker id="lateArrow" color={theme.lateReflection} />
          
          {/* グリッド線 */}
          <defs>
            <pattern id={`grid-${isDark ? 'dark' : 'light'}`} width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke={theme.gridLight} strokeWidth="1" opacity={isDark ? "0.3" : "1"}/>
            </pattern>
          </defs>
          <rect x={margin.left} y={margin.top} width={chartWidth} height={chartHeight} fill={`url(#grid-${isDark ? 'dark' : 'light'})`} />
          
          {/* 部屋の境界線 */}
          <rect 
            x={margin.left} 
            y={margin.top} 
            width={chartWidth} 
            height={chartHeight} 
            fill="none" 
            stroke={theme.gridDark} 
            strokeWidth="3"
          />
          
          {/* 壁のラベル */}
          <text x={margin.left + chartWidth/2} y={margin.top - 10} textAnchor="middle" fontSize="11" fill={theme.textSecondary}>天井</text>
          <text x={margin.left + chartWidth/2} y={margin.top + chartHeight + 20} textAnchor="middle" fontSize="11" fill={theme.textSecondary}>床</text>
          <text x={margin.left - 30} y={margin.top + chartHeight/2} textAnchor="middle" fontSize="11" fill={theme.textSecondary} transform={`rotate(-90, ${margin.left - 30}, ${margin.top + chartHeight/2})`}>左壁</text>
          <text x={margin.left + chartWidth + 30} y={margin.top + chartHeight/2} textAnchor="middle" fontSize="11" fill={theme.textSecondary} transform={`rotate(90, ${margin.left + chartWidth + 30}, ${margin.top + chartHeight/2})`}>右壁</text>
          
          {/* 直接音の経路 */}
          <SoundPath 
            points={[speaker, listener]}
            color={theme.directSound}
            strokeWidth="4"
            label="直接音"
            markerEnd="url(#directArrow)"
          />
          
          {/* 初期反射音の経路（複数パス） */}
          <SoundPath 
            points={[speaker, ceilingReflection, listener]}
            color={theme.earlyReflection}
            strokeWidth="3"
            strokeDasharray="8 4"
            label="天井反射"
            markerEnd="url(#earlyArrow)"
          />
          <SoundPath 
            points={[speaker, leftWallReflection, listener]}
            color={theme.earlyReflection}
            strokeWidth="3"
            strokeDasharray="8 4"
            markerEnd="url(#earlyArrow)"
          />
          <SoundPath 
            points={[speaker, floorReflection, listener]}
            color={theme.earlyReflection}
            strokeWidth="3"
            strokeDasharray="8 4"
            markerEnd="url(#earlyArrow)"
          />
          
          {/* 後期反射音の経路（複雑な経路の例) */}
          <SoundPath 
            points={[speaker, rightWallReflection, ceilingReflection, leftWallReflection, listener]}
            color={theme.lateReflection}
            strokeWidth="2"
            strokeDasharray="3 3"
            markerEnd="url(#lateArrow)"
          />
          
          {/* 反射点 */}
          <circle cx={scaleX(ceilingReflection.x)} cy={scaleY(ceilingReflection.y)} r="4" fill={theme.reflection} stroke={theme.surface} strokeWidth="1" />
          <circle cx={scaleX(leftWallReflection.x)} cy={scaleY(leftWallReflection.y)} r="4" fill={theme.reflection} stroke={theme.surface} strokeWidth="1" />
          <circle cx={scaleX(rightWallReflection.x)} cy={scaleY(rightWallReflection.y)} r="4" fill={theme.reflection} stroke={theme.surface} strokeWidth="1" />
          <circle cx={scaleX(floorReflection.x)} cy={scaleY(floorReflection.y)} r="4" fill={theme.reflection} stroke={theme.surface} strokeWidth="1" />
          
          {/* スピーカー */}
          <polygon 
            points={`${scaleX(speaker.x)},${scaleY(speaker.y)-12} ${scaleX(speaker.x)-10},${scaleY(speaker.y)+6} ${scaleX(speaker.x)+10},${scaleY(speaker.y)+6}`}
            fill={theme.speaker}
            stroke={theme.surface}
            strokeWidth="2" 
          />
          <text x={scaleX(speaker.x)} y={scaleY(speaker.y) + 25} textAnchor="middle" fontSize="12" fontWeight="bold" fill={theme.speaker}>
            スピーカー
          </text>
          
          {/* リスナー */}
          <circle cx={scaleX(listener.x)} cy={scaleY(listener.y)} r="10" fill={theme.listener} stroke={theme.surface} strokeWidth="2" />
          <circle cx={scaleX(listener.x)} cy={scaleY(listener.y)} r="5" fill={theme.surface} />
          <text x={scaleX(listener.x)} y={scaleY(listener.y) + 25} textAnchor="middle" fontSize="12" fontWeight="bold" fill={theme.listener}>
            リスナー
          </text>
          
          {/* 軸ラベル */}
          <text x={margin.left + chartWidth/2} y={svgHeight - 15} textAnchor="middle" fontSize="12" fill={theme.text}>
            部屋の幅 (m)
          </text>
          <text x={20} y={margin.top + chartHeight/2} textAnchor="middle" fontSize="12" fill={theme.text} transform={`rotate(-90, 20, ${margin.top + chartHeight/2})`}>
            部屋の奥行 (m)
          </text>
          
          {/* 目盛り */}
          {[0, 2, 4, 6, 8].map(x => (
            <g key={x}>
              <line x1={scaleX(x)} y1={margin.top + chartHeight} x2={scaleX(x)} y2={margin.top + chartHeight + 5} stroke={theme.text} strokeWidth="1" />
              <text x={scaleX(x)} y={margin.top + chartHeight + 18} textAnchor="middle" fontSize="10" fill={theme.text}>{x}</text>
            </g>
          ))}
          {[0, 1, 2, 3, 4, 5].map(y => (
            <g key={y}>
              <line x1={margin.left - 5} y1={scaleY(y)} x2={margin.left} y2={scaleY(y)} stroke={theme.text} strokeWidth="1" />
              <text x={margin.left - 8} y={scaleY(y) + 3} textAnchor="end" fontSize="10" fill={theme.text}>{y}</text>
            </g>
          ))}
        </svg>
      </div>
      
      {/* レジェンド */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '24px', 
        marginTop: '16px',
        fontSize: '12px',
        flexWrap: 'wrap',
        color: theme.text
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            width: '20px', 
            height: '3px', 
            backgroundColor: theme.directSound, 
            marginRight: '6px' 
          }}></div>
          <span style={{ color: theme.text }}><strong>直接音</strong>（最短経路）</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            width: '20px', 
            height: '3px', 
            backgroundColor: theme.earlyReflection, 
            marginRight: '6px',
            borderStyle: 'dashed',
            borderWidth: '0 0 3px 0'
          }}></div>
          <span style={{ color: theme.text }}><strong>初期反射音</strong>（1回反射）</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            width: '20px', 
            height: '2px', 
            backgroundColor: theme.lateReflection, 
            marginRight: '6px',
            borderStyle: 'dotted',
            borderWidth: '0 0 2px 0'
          }}></div>
          <span style={{ color: theme.text }}><strong>後期反射音</strong>（複数回反射）</span>
        </div>
      </div>
      
      {/* 説明テキスト */}
      <div style={{ 
        marginTop: '16px', 
        fontSize: '12px', 
        color: theme.text,
        textAlign: 'left',
        maxWidth: '600px',
        margin: '16px auto 0',
        backgroundColor: theme.surface,
        padding: '12px',
        borderRadius: '6px',
        border: `1px solid ${theme.border}`
      }}>
        <p><strong style={{ color: theme.text }}>直接音（実線）:</strong> スピーカーから壁に当たることなくリスナーに直接届く音</p>
        <p><strong style={{ color: theme.text }}>初期反射音（破線）:</strong> 壁・床・天井で1回反射してリスナーに届く音</p>
        <p><strong style={{ color: theme.text }}>後期反射音（点線）:</strong> 複数回反射を繰り返して遅れて届く残響音</p>
      </div>
    </div>
  )
}

export default SoundPropagationChart