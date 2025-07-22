export function CategoryFilter({ categories, selectedCategory, onCategoryChange }) {
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      padding: '20px',
      justifyContent: 'center'
    }}>
      {categories.map(category => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          style={{
            padding: '12px 20px',
            borderRadius: '20px',
            fontWeight: '600',
            fontSize: '14px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            transform: 'translateY(0)',
            background: selectedCategory === category.id
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'rgba(255, 255, 255, 0.1)',
            color: selectedCategory === category.id ? 'white' : '#E0E0E0',
            boxShadow: selectedCategory === category.id
              ? '0 10px 30px rgba(102, 126, 234, 0.4)'
              : '0 5px 15px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            border: selectedCategory === category.id
              ? '1px solid rgba(255, 255, 255, 0.3)'
              : '1px solid rgba(255, 255, 255, 0.2)',
            minWidth: '120px'
          }}
          onMouseEnter={(e) => {
            if (selectedCategory !== category.id) {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)'
              e.target.style.color = 'white'
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)'
            }
          }}
          onMouseLeave={(e) => {
            if (selectedCategory !== category.id) {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)'
              e.target.style.color = '#E0E0E0'
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)'
            }
          }}
          onMouseDown={(e) => {
            e.target.style.transform = 'translateY(0) scale(0.95)'
          }}
          onMouseUp={(e) => {
            e.target.style.transform = selectedCategory === category.id
              ? 'translateY(0) scale(1)'
              : 'translateY(-2px) scale(1)'
          }}
        >
          <span style={{ marginRight: '8px' }}>{category.icon}</span>
          {category.name}
        </button>
      ))}
    </div>
  )
}
