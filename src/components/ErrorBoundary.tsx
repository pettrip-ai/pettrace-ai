import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message ?? '' }
  }

  componentDidCatch(_error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] caught', _error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-bg text-ink">
          <div className="max-w-md w-full bg-white border border-rule rounded-2xl shadow-lg p-8 text-center">
            <div className="text-4xl mb-3">🐾</div>
            <div className="text-lg font-semibold">哎呀，这里出了点小问题</div>
            <div className="text-sm text-muted mt-2 leading-relaxed">
              请刷新或重启 Demo
              {this.state.message && (
                <div className="mt-2 text-[11px] text-muted/80 break-all">{this.state.message}</div>
              )}
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <Link
                to="/map"
                className="inline-flex items-center justify-center px-5 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent/90 transition"
              >
                回到地图
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center px-5 py-2 rounded-md border border-rule text-sm text-muted hover:text-ink hover:bg-bg2 transition"
              >
                刷新页面
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
