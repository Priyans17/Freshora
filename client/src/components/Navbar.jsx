import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext'

const Navbar = () => {
  const [open, setOpen] = useState(false)

  const {
    user,
    setUser,
    getCartCount,
    setShowUserLogin,
    searchQuery,
    setSearchQuery,
    navigate,
    axios
  } = useAppContext()

  const logout = async () => {
    try {
      const { data } = await axios.get("/api/user/logout");
      if (data.success) {
        setUser(null);
        setOpen(false);
        toast.success("Logged out successfully");
        navigate('/');
      } else {
        toast.error(data.message || "Logout failed");
      }
    } catch (error) {
      console.log(error);
      // Still logout locally even if API call fails
      setUser(null);
      setOpen(false);
      navigate('/');
    }
  }

  useEffect(() => {
    if (searchQuery && searchQuery.length > 0) {
      navigate('/products')
    }
  }, [searchQuery, navigate])

  return (
    <nav className="flex items-center justify-between px-6 md:px-16 lg:px-24 xl:px-32 py-4 border-b border-gray-300 bg-white relative">

      {/* Logo */}
      <NavLink to="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
  <img className="h-9 w-auto" src={assets.logo} alt="logo" />
  <span className="text-xl font-semibold tracking-wide text-gray-800">
    FRESHORA
  </span>
      </NavLink>

      {/* Desktop Menu */}
      <div className="hidden sm:flex items-center gap-8">
        <NavLink to="/" className="text-gray-500 hover:text-gray-800">Home</NavLink>
        <NavLink to="/products" className="text-gray-500 hover:text-gray-800">All Products</NavLink>
        <NavLink to="/contact" className="text-gray-500 hover:text-gray-800">Contact</NavLink>

        {/* Search */}
        <div className="hidden lg:flex items-center gap-2 border border-gray-300 px-3 rounded-full">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="py-1.5 bg-transparent outline-none"
            placeholder="Search products"
          />
          <img src={assets.search_icon} className="w-4 h-4" />
        </div>

        {/* Cart */}
        <div onClick={() => navigate('/cart')} className="relative cursor-pointer">
          <img src={assets.nav_cart_icon} className="w-6 opacity-80" />
          <span className="absolute -top-2 -right-3 text-xs text-white bg-primary w-[18px] h-[18px] rounded-full flex items-center justify-center">
            {getCartCount()}
          </span>
        </div>

        {/* Auth */}
        {!user ? (
          <button
            onClick={() => setShowUserLogin(true)}
            className="px-8 py-2 bg-primary text-white rounded-full"
          >
            Login
          </button>
        ) : (
          <div className="relative group">
            <img src={assets.profile_icon} className="w-10 cursor-pointer" />
            <ul className="hidden group-hover:block absolute right-0 bg-white border shadow rounded-md w-40 text-sm">
              <li onClick={() => navigate('/my-orders')} className="px-4 py-2 hover:bg-primary/10">
                My Orders
              </li>
              <li onClick={logout} className="px-4 py-2 hover:bg-primary/10">
                Logout
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Mobile Icons */}
      <div className="flex items-center gap-4 sm:hidden">
        <div onClick={() => navigate('/cart')} className="relative cursor-pointer">
          <img src={assets.nav_cart_icon} className="w-6" />
          <span className="absolute -top-2 -right-3 text-xs text-white bg-primary w-[18px] h-[18px] rounded-full flex items-center justify-center">
            {getCartCount()}
          </span>
        </div>

        <button onClick={() => setOpen(!open)}>
          <img src={assets.menu_icon} />
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="absolute top-[60px] left-0 w-full bg-white shadow-md py-4 px-5 flex flex-col gap-2 sm:hidden">
          <NavLink to="/" onClick={() => setOpen(false)}>Home</NavLink>
          <NavLink to="/products" onClick={() => setOpen(false)}>All Products</NavLink>
          {user && <NavLink to="/my-orders" onClick={() => setOpen(false)}>My Orders</NavLink>}
          <NavLink to="/contact" onClick={() => setOpen(false)}>Contact</NavLink>

          {!user ? (
            <button
              onClick={() => setShowUserLogin(true)}
              className="mt-2 px-6 py-2 bg-primary text-white rounded-full"
            >
              Login
            </button>
          ) : (
            <button
              onClick={logout}
              className="mt-2 px-6 py-2 bg-primary text-white rounded-full"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  )
}

export default Navbar
