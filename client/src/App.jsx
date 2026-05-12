import { BrowserRouter, Routes, Route } from "react-router-dom"

import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Upload from "./pages/Upload"
import DashboardLayout from "./components/DashboardLayouts"
import Chat from "./pages/Chat"

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="upload" element={<Upload />} />
          <Route path="chat/:id" element={<Chat />} />
        </Route>

      </Routes>
    </BrowserRouter>
  )
}

export default App