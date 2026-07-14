import './App.css'

type FinalAnswerPageProps = {
  onBack: () => void
}

function FinalAnswerPage({ onBack }: FinalAnswerPageProps) {
  return (
    <div className="blank-page final-answer-page" aria-label="final answer page">
      <button type="button" className="back-button" onClick={onBack}>
        back
      </button>
    </div>
  )
}

export default FinalAnswerPage
