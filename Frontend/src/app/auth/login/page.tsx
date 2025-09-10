import {
    Container,
    Card,
    Heading,
    Flex,
    Text,
    Link
} from "@radix-ui/themes";
import SigninForm from "@/components/auth/SigninForm";
import BackendStatus from "@/components/debug/BackendStatus";
import NavLink from "next/link";

function LoginPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
            <Container size="2" className="w-full max-w-md">
                <BackendStatus />
                <Card size="1" className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                    <div className="p-6">
                        <Heading size="6" className="text-center text-slate-800 mb-8 font-light pb-6">
                            Iniciar Sesión
                        </Heading>

                        <SigninForm/>
                        
                        <Flex justify="center" mt="6" className="border-t border-slate-100 pt-6">
                            <Text size="2" className="text-slate-600">
                                ¿No tienes cuenta?{" "}
                                <Link asChild className="text-blue-600 hover:text-blue-700 font-medium">
                                    <NavLink href="/auth/register">Regístrate aquí</NavLink>
                                </Link>
                            </Text>
                        </Flex>
                    </div>
                </Card>
            </Container>
        </div>
    );
}

export default LoginPage;
