import { PawPrint, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CITIES } from '../../data/mock'
import { useStore } from '../../store/useStore'
import { DEMO_SCENARIOS, buildPlanningSignals, petDisplayName, scenarioPromptForPet } from './missionControl'
import { DemoScenarioCard, MissionControlHero, PlanningSignals, ScenarioRail } from './components/MissionControl'

export default function PlannerPage() {
  const { city, pets, places, feeds, clearChat, showPetInChat, setShowPetInChat } = useStore()
  const navigate = useNavigate()
  const pet = pets[0]
  const petNameForDemo = pet?.name ?? '豆豆'
  const petLabelForUi = pet ? pet.name : '未添加宠物'
  const petDetail = petDisplayName(pet)
  const cityName = CITIES[city]?.name ?? '当前城市'
  const signals = buildPlanningSignals({ city, pet, showPetInChat, places, feeds })
  const primaryScenario = {
    ...DEMO_SCENARIOS[0],
    prompt: scenarioPromptForPet(DEMO_SCENARIOS[0].prompt, petNameForDemo),
  }
  const secondaryScenarios = DEMO_SCENARIOS.slice(1).map((scenario) => ({
    ...scenario,
    prompt: scenarioPromptForPet(scenario.prompt, petNameForDemo),
  }))

  function runScenario(prompt: string) {
    clearChat()
    navigate({ pathname: '/ai/chat', search: `q=${encodeURIComponent(prompt)}` })
  }

  function openChat() {
    clearChat()
    navigate({ pathname: '/ai/chat' })
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-bg" style={{ paddingBottom: 'calc(150px + var(--sab, 0px))' }}>
      <div className="flex flex-col px-4 pt-3">
        <MissionControlHero
          petLabel={petLabelForUi}
          cityName={cityName}
          hasPet={!!pet}
          showPetInChat={showPetInChat}
          onTogglePetContext={() => setShowPetInChat(!showPetInChat)}
        />

        <PlanningSignals signals={signals} />

        <DemoScenarioCard scenario={primaryScenario} onRun={runScenario} />

        <ScenarioRail scenarios={secondaryScenarios} onRun={runScenario} />

        <section className="mb-4 rounded-2xl border border-rule/50 bg-white/80 p-4 shadow-card">
          <p className="pettrace-caption mb-1" style={{ color: 'var(--color-muted-foreground)' }}>
            当前档案
          </p>
          <div className="flex items-center gap-3">
            <div className="avatar gradient sm shrink-0" title={petLabelForUi}>
              {petLabelForUi.slice(0, 1)}
            </div>
            <p className="pettrace-body truncate" style={{ margin: 0, color: 'var(--color-on-surface)' }}>
              {petDetail}
            </p>
          </div>
        </section>
      </div>

      <div
        className="fixed z-40"
        style={{
          bottom: 'calc(76px + var(--sab))',
          left: 16,
          right: 16,
          padding: '0 0 0',
        }}
      >
        <div
          className="chat-wrap"
          style={{
            maxWidth: '100%',
            minWidth: 0,
            boxShadow: 'var(--shadow-3)',
            alignItems: 'center',
          }}
          onClick={openChat}
        >
          <PawPrint size={18} style={{ color: 'var(--primary)', opacity: 1, flexShrink: 0 }} />
          <input
            className="chat-input"
            type="text"
            placeholder="描述宠物、城市和出行限制..."
            readOnly
            style={{ flex: 1, minWidth: 0, height: 20, lineHeight: '20px', cursor: 'text' }}
          />
          <button className="chat-send" aria-label="发送">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
