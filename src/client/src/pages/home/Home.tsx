import { Button } from "@/src/lib/components/ui/button";
import { useApi } from "@/src/lib/hooks/use-api";
import { Input } from "@/src/lib/components/ui/input";
import { useState } from "react";

export default function HomePage() {
    const api = useApi();
    const { mutateAsync: getUSDT, status, error } = api.usdtFaucet;
    const [address, setAddress] = useState("");
    
    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        
        try {
            await getUSDT(address);
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <div
            className="h-full flex flex-col items-center justify-center gap-4"
        >
            <form className="flex items-center justify-center gap-4 w-full max-w-xl" onSubmit={handleSubmit}>
                <Input
                    placeholder="Enter your address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                />

                <Button type="submit">
                    Get USDT
                </Button>
            </form>
        </div>
    )
}