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
            const res = await fetch(`${apiUrl}/payment/create?amount=${amount}`, {
                method: "POST",
                headers: {
                    "X-User-ID": user.uid
                }
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("Payment creation failed: " + (data.detail || "Unknown error"));
            }
        } catch (e) {
            alert("Error creating payment");
            console.error(e);
        }
    };

    return { handlePayment };
};
