import './App.css'

type BlankPageProps = {
  onBack: () => void
}

function BlankPage({ onBack }: BlankPageProps) {
  return (
    <div className="blank-page" aria-label="blank page">
      <button type="button" className="back-button" onClick={onBack}>
        back
      </button>
    </div>
  )
}

export default BlankPage
