import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, Shield, ShieldAlert, Loader2 } from "lucide-react"

interface User {
  id: number
  username: string
  rol: string
  created_at: string
}

export function UsuariosPanel() {
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsuarios()
  }, [])

  const fetchUsuarios = async () => {
    setLoading(true)
    setError(null)
    const token = localStorage.getItem("adminToken")
    try {
      const res = await fetch("http://localhost:5000/api/usuarios", {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al cargar usuarios")
      setUsuarios(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const changeRole = async (userId: number, newRole: string) => {
    const token = localStorage.getItem("adminToken")
    try {
      const res = await fetch(`http://localhost:5000/api/usuarios/${userId}/rol`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ rol: newRole })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Error al cambiar rol")
      }
      setUsuarios(usuarios.map(u => u.id === userId ? { ...u, rol: newRole } : u))
    } catch (err: any) {
      alert("Hubo un error: " + err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Users className="w-8 h-8 text-primary" />
          Gestión de Usuarios
        </h2>
        <p className="text-muted-foreground text-lg max-w-3xl">
          Administra las cuentas de la plataforma y asigna privilegios de administración.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cuentas Registradas</CardTitle>
          <CardDescription>
            Solo los administradores pueden sincronizar datos del observatorio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Usuario</th>
                    <th className="px-6 py-4">Fecha de Registro</th>
                    <th className="px-6 py-4">Rol Actual</th>
                    <th className="px-6 py-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {usuarios.map(user => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">{user.id}</td>
                      <td className="px-6 py-4 font-medium">{user.username}</td>
                      <td className="px-6 py-4">{new Date(user.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${user.rol === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {user.rol === 'admin' ? <ShieldAlert className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                          {user.rol.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <select 
                          className="text-sm border rounded-md px-2 py-1 bg-background"
                          value={user.rol}
                          onChange={(e) => changeRole(user.id, e.target.value)}
                        >
                          <option value="usuario">Usuario Normal</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
