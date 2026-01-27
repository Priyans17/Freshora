import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dummyProducts } from '../assets/assets';
import toast from 'react-hot-toast';
import axios from 'axios'; 

// axios global config
axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {

    const currency = import.meta.env.VITE_CURRENCY_SYMBOL || '₹';

    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isSeller, setIsSeller] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showUserLogin, setShowUserLogin] = useState(false);
    const [products, setProducts] = useState([]);
    const [cartItems, setCartItems] = useState({});

    const fetchProducts = async () => {
        setProducts(dummyProducts);
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const addToCart = (itemId) => {
        let cartData = structuredClone(cartItems);

        cartData[itemId] = (cartData[itemId] || 0) + 1;
        setCartItems(cartData);

        toast.success("Item added to cart");
    };

    const updateCartItem = (itemId, quantity) => {
        let cartData = structuredClone(cartItems);

        if (quantity <= 0) delete cartData[itemId];
        else cartData[itemId] = quantity;

        setCartItems(cartData);
        toast.success("Cart updated successfully");
    };

    const removeFromCart = (itemId) => {
        let cartData = structuredClone(cartItems);

        if (cartData[itemId]) {
            cartData[itemId] -= 1;
            if (cartData[itemId] === 0) delete cartData[itemId];
        }

        setCartItems(cartData);

        toast("Item removed from cart", {
            icon: "🗑️",
        });
    };

    const getCartCount = () =>
        Object.values(cartItems).reduce((a, b) => a + b, 0);

    const value = {
        navigate,
        user,
        setUser,
        isSeller,
        setIsSeller,
        searchQuery,
        setSearchQuery,
        showUserLogin,
        setShowUserLogin,
        products,
        currency,
        cartItems,
        addToCart,
        updateCartItem,
        removeFromCart,
        getCartCount,
        axios 
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    return useContext(AppContext);
};
