import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// 1. Carregar variáveis do .env.local manualmente para evitar dependência de pacotes externos
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, "utf-8");
  envFile.split("\n").forEach((line) => {
    // Ignora comentários e linhas vazias
    if (line.trim().startsWith("#") || !line.trim()) return;
    
    const [key, ...valueChunks] = line.split("=");
    if (key && valueChunks.length > 0) {
      process.env[key.trim()] = valueChunks.join("=").trim().replace(/(^"|"$)/g, '');
    }
  });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BOOTSTRAP_EMAIL = process.env.BOOTSTRAP_EMAIL;
const BOOTSTRAP_PASSWORD = process.env.BOOTSTRAP_PASSWORD;

async function bootstrap() {
  console.log("🚀 Iniciando Bootstrap DEV de Operador...");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ ERRO: Faltam variáveis de conexão do Supabase.");
    console.error("Verifique se VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão no .env.local");
    process.exit(1);
  }

  if (!BOOTSTRAP_EMAIL || !BOOTSTRAP_PASSWORD) {
    console.error("❌ ERRO: Faltam credenciais do usuário.");
    console.error("Defina BOOTSTRAP_EMAIL e BOOTSTRAP_PASSWORD no .env.local");
    process.exit(1);
  }

  // 2. Criar cliente com SERVICE_ROLE para bypass de RLS e confirmação de e-mail
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // 3. Checar se usuário já existe e criar usando admin API (auto-confirma email)
  console.log(`\n🔎 Verificando/Criando usuário: ${BOOTSTRAP_EMAIL}`);
  
  let userId = null;

  // Tentamos criar o usuário diretamente. Se falhar dizendo que já existe, 
  // listamos os usuários (via admin API) para pegar o ID.
  const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: BOOTSTRAP_EMAIL,
    password: BOOTSTRAP_PASSWORD,
    email_confirm: true, // Bypass de confirmação!
  });

  if (createError) {
    if (createError.message.includes("already registered") || createError.status === 422) {
      console.log("ℹ️ Usuário já existe. Localizando UUID...");
      // Lista de usuários na API do admin para encontrar pelo e-mail
      const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
      if (usersError) {
        console.error("❌ Erro ao listar usuários:", usersError.message);
        process.exit(1);
      }
      const existingUser = usersData.users.find(u => u.email === BOOTSTRAP_EMAIL);
      if (!existingUser) {
        console.error("❌ Usuário não encontrado, mas erro de criação ocorreu. Verifique o Painel.");
        process.exit(1);
      }
      userId = existingUser.id;
      
      // Forçar a confirmação do email do usuário existente caso estivesse pendente
      if (!existingUser.email_confirmed_at) {
         console.log("🔄 Usuário existia com e-mail não confirmado. Confirmando agora...");
         await supabaseAdmin.auth.admin.updateUserById(userId, { email_confirm: true });
      }

    } else {
      console.error("❌ Erro ao criar usuário:", createError.message);
      process.exit(1);
    }
  } else {
    console.log("✅ Novo usuário criado com e-mail auto-confirmado.");
    userId = createData.user.id;
  }

  // 4. Inserir em public.user_roles
  console.log(`\n🛡️  Garantindo role 'operador' para o UUID: ${userId}`);
  
  const { error: roleError } = await supabaseAdmin
    .from('user_roles')
    .upsert(
      { user_id: userId, role: 'operador' },
      { onConflict: 'user_id,role' }
    );

  if (roleError) {
    console.error("❌ Erro ao atribuir role:", roleError.message);
    process.exit(1);
  }

  console.log("✅ Role 'operador' atribuída com sucesso.");

  console.log("\n🎉 BOOTSTRAP CONCLUÍDO COM SUCESSO!");
  console.log("---------------------------------------------------");
  console.log("Você pode agora acessar http://localhost:8080/");
  console.log("Fazer o login com:");
  console.log(`E-mail: ${BOOTSTRAP_EMAIL}`);
  console.log(`Senha: [Oculta por segurança]`);
  console.log("E então navegar para http://localhost:8080/base para importar a planilha.");
  console.log("---------------------------------------------------");
}

bootstrap().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
