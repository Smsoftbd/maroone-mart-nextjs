import toast from "react-hot-toast";

export const appToast = {
  addedToCart: (productName: string) =>
    toast.success(`${productName} added to cart`, { icon: "🛒" }),

  removedFromCart: () => toast.success("Item removed"),

  orderSuccess: (invoiceNumber: string) =>
    toast.success(`Order ${invoiceNumber} placed!`),

  couponApplied: (amount: string) =>
    toast.success(`Coupon applied! Saved ${amount}`),

  loginSuccess: (name: string) =>
    toast.success(`Welcome back, ${name}!`),

  logoutSuccess: () => toast.success("Logged out"),

  apiError: (message?: string) =>
    toast.error(message || "Something went wrong. Please try again."),

  wishlistAdded: () => toast.success("Added to wishlist"),
  wishlistRemoved: () => toast.success("Removed from wishlist"),
};
