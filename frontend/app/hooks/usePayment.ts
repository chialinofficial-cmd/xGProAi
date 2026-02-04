import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export const usePayment = () => {
    const { user } = useAuth();
    const router = useRouter();

    const handlePayment = async (amount: number) => {
        if (!user) {
            router.push('/signup');
            return;
        }

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

            // Use the correct endpoint matching backend/main.py
            const res = await fetch(`${apiUrl}/paystack/initialize`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-User-ID": user.uid
                },
                body: JSON.stringify({
                    amount: amount,
                    email: user.email // Backend requires email
                })
            });

            const data = await res.json();

            if (res.ok && data.authorization_url) {
                window.location.href = data.authorization_url;
            } else {
                console.error("Payment Error Data:", data);
                alert("Payment creation failed: " + (data.detail || "Unknown error"));
            }
        } catch (e) {
            console.error("Payment Exception:", e);
            alert("Error creating payment. Please check console.");
        }
    };

    return { handlePayment };
};
