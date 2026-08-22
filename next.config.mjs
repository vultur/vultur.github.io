import nextra from "nextra";

export default nextra({})({
    images: {
        unoptimized: true,
    },
    output: process.env.NODE_ENV === "production" ? "export" : undefined,
});
