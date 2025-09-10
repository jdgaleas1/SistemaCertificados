import {
    Container,
    Card,
    Heading,
    Flex,
    Text,
    Link
} from "@radix-ui/themes";
import SignupForm from "@/components/auth/SignupForm";
import NavLink from "next/link";

function RegisterPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
            <Container size="2" className="w-full">
                <Card size="1" className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                    <div className="p-6">
                        <Heading size="6" className="text-center text-slate-800 mb-8 pb-6 font-light">
                            Crear Cuenta
                        </Heading>

                        <SignupForm/>

                        <Flex justify="center" mt="6" className="border-t border-slate-100 pt-6">
                            <Text size="2" className="text-slate-600">
                                ¿Ya tienes cuenta?{" "}
                                <Link asChild className="text-blue-600 hover:text-blue-700 font-medium">
                                    <NavLink href="/auth/login">Inicia sesión</NavLink>
                                </Link>
                            </Text>
                        </Flex>
                    </div>
                </Card>
            </Container>
        </div>
    );
}

export default RegisterPage;
