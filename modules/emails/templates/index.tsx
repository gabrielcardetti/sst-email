import { render } from "@react-email/render";
import { WelcomeTemplate } from "./welcome.template";


export const WelcomeEmail = async (props: {
    url: string;
}) => {
    const html = await render(<WelcomeTemplate url={props.url} />);
    const text = await render(<WelcomeTemplate url={props.url} />, { plainText: true });

    return {
        html,
        text
    }
};
