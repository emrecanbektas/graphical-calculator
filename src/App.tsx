import Calculator from './components/Calculator/Calculator'

export default function App() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0b0f',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '32px 16px 48px',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.06) 0%, transparent 60%)',
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <Calculator />
      </div>
    </div>
  )
}
