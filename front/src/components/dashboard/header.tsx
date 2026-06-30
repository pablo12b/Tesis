import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Loader2, Home, Lock, Unlock, X, Users, ChevronDown, Calendar } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface HeaderProps {
  activePage: string
  onPageChange: (page: string) => void
  selectedDate?: string
  onDateChange?: (date: string) => void
}

export function DashboardHeader({ activePage, onPageChange, selectedDate = "", onDateChange }: HeaderProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [updateStatus, setUpdateStatus] = useState<"idle" | "success" | "error">("idle")
  const [updateMessage, setUpdateMessage] = useState("")
  const [updateLogs, setUpdateLogs] = useState<string[]>([])
  const [availableDates, setAvailableDates] = useState<string[]>([])

  useEffect(() => {
    const token = localStorage.getItem("adminToken")
    if (token) setIsAdmin(true)
  }, [])

  useEffect(() => {
    // Fetch available dates for the active page
    const fetchDates = async () => {
      try {
        const targetInstitucion = activePage === "Vista Global" ? "GLOBAL" : activePage;
        const res = await fetch(`http://localhost:5000/api/fechas_disponibles/${targetInstitucion}`)
        const dates = await res.json()
        if (Array.isArray(dates)) {
          setAvailableDates(dates)
        }
      } catch (e) {
        console.error("Error fetching available dates", e)
      }
    }
    fetchDates()
  }, [activePage])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")
    const endpoint = isRegistering ? "/api/register" : "/api/login"
    
    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      
      if (res.ok) {
        if (isRegistering) {
          alert("Usuario creado exitosamente. Ahora puedes iniciar sesión.")
          setIsRegistering(false)
          setPassword("")
        } else {
          localStorage.setItem("adminToken", data.token)
          // Decode token to see if admin
          const payload = JSON.parse(atob(data.token.split('.')[1]))
          if (payload.role === 'admin') setIsAdmin(true)
          setShowLogin(false)
          setUsername("")
          setPassword("")
        }
      } else {
        setLoginError(data.error || "Error de autenticación")
      }
    } catch (err) {
      setLoginError("Error de conexión")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("adminToken")
    setIsAdmin(false)
  }

  const handleUpdate = async () => {
    setIsUpdating(true)
    setUpdateStatus("idle")
    setUpdateLogs([]) // Limpiar logs anteriores
    const token = localStorage.getItem("adminToken")
    const targetInstitucion = activePage === "Vista Global" ? "TODAS" : activePage;
    try {
      const response = await fetch('http://localhost:5000/api/scraper/run', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ institucion: targetInstitucion }),
      })
      
      if (!response.body) throw new Error("No readable stream available");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        lines.forEach(line => {
          if (line.includes('__SUCCESS__')) {
            setUpdateStatus("success")
            setUpdateMessage(`¡Actualización de ${targetInstitucion} completada exitosamente!`)
          } else if (line.includes('__ERROR__')) {
            setUpdateStatus("error")
            setUpdateMessage('Hubo un error al actualizar: ' + line.replace('__ERROR__', ''))
          } else if (line.trim()) {
            setUpdateLogs(prev => [...prev, line.trim()])
          }
        });
      }
      
    } catch (error: any) {
      setUpdateStatus("error")
      setUpdateMessage('Hubo un error de conexión: ' + error.message)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <>
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex h-16 items-center justify-between px-6 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 md:hidden cursor-pointer" onClick={() => onPageChange("Contexto del Proyecto")}>
            <img src="/logos/logo.png" alt="Logo Bienestar" className="w-8 h-8 object-contain" />
            <h1 className="text-lg font-semibold text-foreground">
              Dashboard
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onPageChange("Contexto del Proyecto")}>
            <img src="/logos/logo.png" alt="Logo Bienestar" className="w-8 h-8 object-contain" />
            <h1 className="text-lg font-semibold text-foreground">
              Análisis de Bienestar Estudiantil
            </h1>
          </div>
        </div>

        <div className="flex-1 flex justify-center items-center gap-3">
          {["UCACUE", "UCUENCA", "UDA", "UPS"].includes(activePage) && (
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm overflow-hidden border border-border/50">
              <img 
                src={`/logos/${activePage.toLowerCase()}.png`} 
                alt={`Logo ${activePage}`} 
                className="w-full h-full object-contain p-1"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}
          {activePage !== "Contexto del Proyecto" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                  <h2 className="text-2xl font-black bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent select-none">
                    {activePage}
                  </h2>
                  <ChevronDown className="w-5 h-5 text-primary mt-1" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={() => onPageChange("Vista Global")}>Vista Global</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPageChange("UPS")}>UPS</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPageChange("UDA")}>UDA</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPageChange("UCACUE")}>UCACUE</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPageChange("UCUENCA")}>UCUENCA</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <h2 className="text-2xl font-black bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent select-none">
              {activePage}
            </h2>
          )}
        </div>

        <div className="flex items-center gap-3">
          {activePage !== "Contexto del Proyecto" && (
            <>
              <Button variant="ghost" size="sm" onClick={() => onPageChange("Contexto del Proyecto")} className="hidden sm:flex gap-2">
                <Home className="w-4 h-4" />
                Inicio
              </Button>
              
              {isAdmin && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => onPageChange("Gestión de Usuarios")} className="hidden sm:flex gap-2">
                    <Users className="w-4 h-4" />
                    Gestión
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 hidden sm:flex"
                    onClick={handleUpdate}
                    disabled={isUpdating}
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    {isUpdating ? "Sincronizando..." : `Sincronizar ${activePage === "Vista Global" ? "Todo" : activePage}`}
                  </Button>
                </>
              )}
              {availableDates.length > 0 && onDateChange && (
                <div className="flex items-center gap-2 border rounded-md px-2 h-9 bg-background/50">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <select 
                    className="bg-transparent text-sm outline-none border-none cursor-pointer"
                    value={selectedDate}
                    onChange={(e) => onDateChange(e.target.value)}
                  >
                    <option value="">Hoy (Actual)</option>
                    {availableDates.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {isAdmin ? (
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground" title="Cerrar sesión Admin">
              <Unlock className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setShowLogin(true)} className="gap-2 text-muted-foreground" title="Acceso Admin">
              <Lock className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </header>

      {/* Overlay de Sincronización */}
      {(isUpdating || updateStatus !== "idle") && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
          <div className="bg-card max-w-md w-full rounded-xl border shadow-2xl p-8 flex flex-col items-center gap-4">
            {isUpdating && (
              <>
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
                <h3 className="text-2xl font-bold mt-4">Sincronizando Datos</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Por favor espera, la Inteligencia Artificial está procesando y extrayendo las narrativas. Esto puede tomar varios minutos...
                </p>
                <div className="w-full mt-4 bg-black/90 text-green-400 font-mono text-xs text-left p-4 rounded-md h-48 overflow-y-auto border border-border/50 shadow-inner flex flex-col-reverse">
                  <div>
                    {updateLogs.map((log, index) => (
                      <div key={index}>{log}</div>
                    ))}
                    <div className="animate-pulse">_</div>
                  </div>
                </div>
              </>
            )}
            
            {!isUpdating && updateStatus === "success" && (
              <>
                <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-2">
                  <RefreshCw className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-green-600">¡Completado!</h3>
                <p className="text-muted-foreground">{updateMessage}</p>
                <Button className="mt-6 w-full py-6 text-lg" onClick={() => window.location.reload()}>
                  Recargar Dashboard
                </Button>
              </>
            )}

            {!isUpdating && updateStatus === "error" && (
              <>
                <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-2">
                  <X className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-red-600">Error</h3>
                <p className="text-muted-foreground">{updateMessage}</p>
                <Button variant="outline" className="mt-6 w-full" onClick={() => setUpdateStatus("idle")}>
                  Cerrar
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de Login (Fuera del header para evitar bugs de backdrop-filter) */}
      {showLogin && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-card w-full max-w-sm rounded-lg border shadow-lg p-6 relative">
            <button 
              onClick={() => { setShowLogin(false); setIsRegistering(false); }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-4">{isRegistering ? "Crear Cuenta" : "Acceso a la Plataforma"}</h3>
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Usuario</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contraseña</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              {loginError && <p className="text-sm text-red-500">{loginError}</p>}
              <Button type="submit" className="w-full">{isRegistering ? "Registrarse" : "Ingresar"}</Button>
              
              <div className="text-center text-sm text-muted-foreground mt-4">
                {isRegistering ? (
                  <p>¿Ya tienes cuenta? <button type="button" onClick={() => setIsRegistering(false)} className="text-primary hover:underline font-medium">Inicia sesión</button></p>
                ) : (
                  <p>¿No tienes cuenta? <button type="button" onClick={() => setIsRegistering(true)} className="text-primary hover:underline font-medium">Regístrate</button></p>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
