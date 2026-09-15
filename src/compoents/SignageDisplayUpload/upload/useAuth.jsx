'use client';
import { useEffect, useState } from "react";
import _ from "lodash";
import CredentialManager from "@/utils/Cookies";

export default function useAuth(cookietoken) {
    const [headers, setHeaders] = useState(null);
    const [loginData, setLoginData] = useState(null);

    const buildHeaders = (cred) => ({
        "Content-Type": "application/json",
        sp: "114",
        yearcode: cred?.YearCode || "",
        version: cred?.cuVer ? atob(cred.cuVer) : "",
        sv: cred?.SV ? atob(cred.SV) : "0"
    });

    useEffect(() => {
        const initAuth = () => {
            try {
                let stored = sessionStorage.getItem("userAuth");

                if (_.isEmpty(stored)) {
                    const cm = new CredentialManager(cookietoken);
                    const creds = cm.getCredentials();
                    sessionStorage.setItem("userAuth", JSON.stringify(creds));
                    stored = JSON.stringify(creds);
                }

                const parsed = JSON.parse(stored);

                setHeaders(buildHeaders(parsed));
                setLoginData({
                    UserId: parsed?.LUId ? atob(parsed.LUId) : "",
                    IpAddress: process.env.NEXT_PUBLIC_IP,
                    Domain: window.location.origin || ""
                });

            } catch (err) {
                console.error("Auth init failed:", err);
            }
        };

        initAuth();
    }, [cookietoken]);

    return { headers, loginData };
}