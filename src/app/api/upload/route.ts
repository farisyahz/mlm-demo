import { route, type Router } from "@better-upload/server";
import { toRouteHandler } from "@better-upload/server/adapters/next";
import { cloudflare } from "@better-upload/server/clients";

import { headers } from "next/headers";
import { auth } from "~/server/better-auth";

const router: Router = {
    client: cloudflare({
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
        accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
    }),
    bucketName: "yapi-app",
    routes: {
        images: route({
            fileTypes: ["image/*"],
            multipleFiles: true,
            maxFiles: 4,
            onBeforeUpload: async () => {
                const session = await auth.api.getSession({
                    headers: await headers(),
                });

                if (!session) {
                    throw new Error("Unauthorized");
                }
            },
        }),
    },
};

export const { POST } = toRouteHandler(router);
