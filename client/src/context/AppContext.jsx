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
    const [showUserLogin, setShowUserLogin] = useState(false);
    const [products, setProducts] = useState([]);
    const [cartItems, setCartItems] = useState({});
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch Products
    const fetchProducts = async () => {
        try {
            const { data } = await axios.get("/api/product/list");
            if (data.success && data.products && data.products.length > 0) {
                setProducts(data.products);
            } else {
                // Fallback to dummy products if API fails
                setProducts(dummyProducts);
            }
        } catch (error) {
            console.log("Error fetching products:", error);
            // Fallback to dummy products if API fails
            setProducts(dummyProducts);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Check user authentication on app load
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data } = await axios.get("/api/user/is-auth");
                if (data.success && data.user) {
                    setUser(data.user);
                }
            } catch (error) {
                // User not authenticated, which is fine
                setUser(null);
            }
        };
        checkAuth();
    }, []);

    // Check seller authentication on app load
    useEffect(() => {
        const checkSellerAuth = async () => {
            try {
                const { data } = await axios.get("/api/seller/is-auth");
                if (data.success) {
                    setIsSeller(true);
                }
            } catch (error) {
                // Seller not authenticated, which is fine
                setIsSeller(false);
            }
        };
        checkSellerAuth();
    }, []);

    // Add Product to Cart
    const addToCart = (itemId) => {
        let cartData = structuredClone(cartItems);

        cartData[itemId] = (cartData[itemId] || 0) + 1;
        setCartItems(cartData);

        toast.success("Item added to cart");
    };

    // Update Cart Item Quantity
    const updateCartItem = (itemId, quantity) => {
        let cartData = structuredClone(cartItems);

        if (quantity <= 0) {
            delete cartData[itemId];
        } else {
            cartData[itemId] = quantity;
        }

        setCartItems(cartData);
        toast.success("Cart updated successfully");
    };

    // Remove From Cart
    const removeFromCart = (itemId) => {
        let cartData = structuredClone(cartItems);

        if (cartData[itemId]) {
            cartData[itemId] -= 1;
            if (cartData[itemId] === 0) {
                delete cartData[itemId];
            }
        }

        setCartItems(cartData);

        toast("Item removed from cart", {
            icon: "🗑️",
        });
    };

    // Get Cart Item Count
    const getCartCount = () => {
        let totalCount = 0;
        for (const item in cartItems) {
            totalCount += cartItems[item];
        }
        return totalCount;
    };

    // Get Cart Total Amount
    const getCartAmount = () => {
        let totalAmount = 0;

        for (const item in cartItems) {
            const itemInfo = products.find(product => product._id === item);

            if (itemInfo && cartItems[item] > 0) {
                totalAmount += itemInfo.offerPrice * cartItems[item];
            }
        }

        return Math.floor(totalAmount * 100) / 100;
    };

    const value = {
        navigate,
        user,
        setUser,
        isSeller,
        setIsSeller,
        showUserLogin,
        setShowUserLogin,
        products,
        setProducts,
        currency,
        cartItems,
        setCartItems,
        addToCart,
        searchQuery,
        setSearchQuery,
        updateCartItem,
        removeFromCart,
        getCartAmount,
        getCartCount,
        axios,
        fetchProducts
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
