import { useState } from "react";
import { AuthForm } from "./components/AuthForm";
import { AuthLayout } from "./components/AuthLayout";

export function Auth(){
    return (
        <>
            <AuthLayout>
                <AuthForm/>
            </AuthLayout>
        </>
    );

}
