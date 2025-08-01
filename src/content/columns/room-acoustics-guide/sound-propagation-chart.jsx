// 音の伝搬経路を示すSVGチャート
const SoundPropagationChart = () => {
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
    <div style={{ fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h4 style={{ margin: '16px 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
        音の伝搬経路（3つの音要素）
      </h4>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>
        リスニングルーム内での音の伝わり方
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg width={svgWidth} height={svgHeight} style={{ border: '1px solid #e0e0e0', borderRadius: '8px' }}>
          {/* 矢印マーカーの定義 */}
          <ArrowMarker id="directArrow" color="#2c3e50" />
          <ArrowMarker id="earlyArrow" color="#ff6b6b" />
          <ArrowMarker id="lateArrow" color="#95a5a6" />
          
          {/* グリッド線 */}
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect x={margin.left} y={margin.top} width={chartWidth} height={chartHeight} fill="url(#grid)" />
          
          {/* 部屋の境界線 */}
          <rect 
            x={margin.left} 
            y={margin.top} 
            width={chartWidth} 
            height={chartHeight} 
            fill="none" 
            stroke="#333" 
            strokeWidth="3"
          />
          
          {/* 壁のラベル */}
          <text x={margin.left + chartWidth/2} y={margin.top - 10} textAnchor="middle" fontSize="11" fill="#666">天井</text>
          <text x={margin.left + chartWidth/2} y={margin.top + chartHeight + 20} textAnchor="middle" fontSize="11" fill="#666">床</text>
          <text x={margin.left - 30} y={margin.top + chartHeight/2} textAnchor="middle" fontSize="11" fill="#666" transform={`rotate(-90, ${margin.left - 30}, ${margin.top + chartHeight/2})`}>左壁</text>
          <text x={margin.left + chartWidth + 30} y={margin.top + chartHeight/2} textAnchor="middle" fontSize="11" fill="#666" transform={`rotate(90, ${margin.left + chartWidth + 30}, ${margin.top + chartHeight/2})`}>右壁</text>
          
          {/* 直接音の経路 */}
          <SoundPath 
            points={[speaker, listener]}
            color="#2c3e50"
            strokeWidth="4"
            label="直接音"
            markerEnd="url(#directArrow)"
          />
          
          {/* 初期反射音の経路（複数パス） */}
          <SoundPath 
            points={[speaker, ceilingReflection, listener]}
            color="#ff6b6b"
            strokeWidth="3"
            strokeDasharray="8 4"
            label="天井反射"
            markerEnd="url(#earlyArrow)"
          />
          <SoundPath 
            points={[speaker, leftWallReflection, listener]}
            color="#ff6b6b"
            strokeWidth="3"
            strokeDasharray="8 4"
            markerEnd="url(#earlyArrow)"
          />
          <SoundPath 
            points={[speaker, floorReflection, listener]}
            color="#ff6b6b"
            strokeWidth="3"
            strokeDasharray="8 4"
            markerEnd="url(#earlyArrow)"
          />
          
          {/* 後期反射音の経路（複雑な経路の例) */}
          <SoundPath 
            points={[speaker, rightWallReflection, ceilingReflection, leftWallReflection, listener]}
            color="#95a5a6"
            strokeWidth="2"
            strokeDasharray="3 3"
            markerEnd="url(#lateArrow)"
          />
          
          {/* 反射点 */}
          <circle cx={scaleX(ceilingReflection.x)} cy={scaleY(ceilingReflection.y)} r="4" fill="#feca57" stroke="#fff" strokeWidth="1" />
          <circle cx={scaleX(leftWallReflection.x)} cy={scaleY(leftWallReflection.y)} r="4" fill="#feca57" stroke="#fff" strokeWidth="1" />
          <circle cx={scaleX(rightWallReflection.x)} cy={scaleY(rightWallReflection.y)} r="4" fill="#feca57" stroke="#fff" strokeWidth="1" />
          <circle cx={scaleX(floorReflection.x)} cy={scaleY(floorReflection.y)} r="4" fill="#feca57" stroke="#fff" strokeWidth="1" />
          
          {/* スピーカー */}
          <polygon 
            points={`${scaleX(speaker.x)},${scaleY(speaker.y)-12} ${scaleX(speaker.x)-10},${scaleY(speaker.y)+6} ${scaleX(speaker.x)+10},${scaleY(speaker.y)+6}`}
            fill="#e74c3c" 
            stroke="#fff" 
            strokeWidth="2" 
          />
          <text x={scaleX(speaker.x)} y={scaleY(speaker.y) + 25} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#e74c3c">
            スピーカー
          </text>
          
          {/* リスナー */}
          <circle cx={scaleX(listener.x)} cy={scaleY(listener.y)} r="10" fill="#3498db" stroke="#fff" strokeWidth="2" />
          <circle cx={scaleX(listener.x)} cy={scaleY(listener.y)} r="5" fill="#fff" />
          <text x={scaleX(listener.x)} y={scaleY(listener.y) + 25} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#3498db">
            リスナー
          </text>
          
          {/* 軸ラベル */}
          <text x={margin.left + chartWidth/2} y={svgHeight - 15} textAnchor="middle" fontSize="12" fill="#333">
            部屋の幅 (m)
          </text>
          <text x={20} y={margin.top + chartHeight/2} textAnchor="middle" fontSize="12" fill="#333" transform={`rotate(-90, 20, ${margin.top + chartHeight/2})`}>
            部屋の奥行 (m)
          </text>
          
          {/* 目盛り */}
          {[0, 2, 4, 6, 8].map(x => (
            <g key={x}>
              <line x1={scaleX(x)} y1={margin.top + chartHeight} x2={scaleX(x)} y2={margin.top + chartHeight + 5} stroke="#333" />
              <text x={scaleX(x)} y={margin.top + chartHeight + 18} textAnchor="middle" fontSize="10" fill="#333">{x}</text>
            </g>
          ))}
          {[0, 1, 2, 3, 4, 5].map(y => (
            <g key={y}>
              <line x1={margin.left - 5} y1={scaleY(y)} x2={margin.left} y2={scaleY(y)} stroke="#333" />
              <text x={margin.left - 8} y={scaleY(y) + 3} textAnchor="end" fontSize="10" fill="#333">{y}</text>
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
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            width: '20px', 
            height: '3px', 
            backgroundColor: '#2c3e50', 
            marginRight: '6px' 
          }}></div>
          <span><strong>直接音</strong>（最短経路）</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            width: '20px', 
            height: '3px', 
            backgroundColor: '#ff6b6b', 
            marginRight: '6px',
            borderStyle: 'dashed',
            borderWidth: '0 0 3px 0'
          }}></div>
          <span><strong>初期反射音</strong>（1回反射）</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            width: '20px', 
            height: '2px', 
            backgroundColor: '#95a5a6', 
            marginRight: '6px',
            borderStyle: 'dotted',
            borderWidth: '0 0 2px 0'
          }}></div>
          <span><strong>後期反射音</strong>（複数回反射）</span>
        </div>
      </div>
      
      {/* 説明テキスト */}
      <div style={{ 
        marginTop: '16px', 
        fontSize: '12px', 
        color: '#666',
        textAlign: 'left',
        maxWidth: '600px',
        margin: '16px auto 0',
        backgroundColor: '#f8f9fa',
        padding: '12px',
        borderRadius: '6px'
      }}>
        <p><strong>直接音（実線）:</strong> スピーカーから壁に当たることなくリスナーに直接届く音</p>
        <p><strong>初期反射音（破線）:</strong> 壁・床・天井で1回反射してリスナーに届く音</p>
        <p><strong>後期反射音（点線）:</strong> 複数回反射を繰り返して遅れて届く残響音</p>
      </div>
    </div>
  )
}

export default SoundPropagationChart