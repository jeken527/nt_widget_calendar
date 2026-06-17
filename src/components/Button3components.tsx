import { withStopPropagation } from "@/utils/utils";
import "@/styles/Button3components.css";
interface Button3componentsProps {
    button3state?: string;
    id?: string;
    className?: string;
    mouseover?: (e: any) => void;
    slot_135_139?: React.ReactNode;
    slot_135_140?: React.ReactNode;
    slot_135_145?: React.ReactNode;
    slot_135_146?: React.ReactNode;
}
const Button3components = (props: Button3componentsProps) => {
    const {
        button3state,
        id,
        className = "",
        mouseover,
        slot_135_139,
        slot_135_140,
        slot_135_145,
        slot_135_146
    } = props;

    return (
        <div
            className={`component-135_150 ${className}`}
            id={id}
            onMouseover={withStopPropagation(mouseover)}
        >
            <div id="135_150" className="Pixso-symbol-135_150">
                {button3state === "default" && (
                    <div id="135_149" className="stroke-wrapper-135_149">
                        <div className="Pixso-symbol-135_149">
                            <div id="135_138" className="Pixso-frame-135_138">
                                {slot_135_139 ?? (
                                    <div
                                        id="135_139"
                                        className="Pixso-vector-135_139"
                                    ></div>
                                )}
                                {slot_135_140 ?? (
                                    <div
                                        id="135_140"
                                        className="Pixso-vector-135_140"
                                    ></div>
                                )}
                            </div>
                        </div>
                        <div className="stroke-135_149"></div>
                    </div>
                )}
                {button3state === "checked" && (
                    <div id="135_148" className="stroke-wrapper-135_148">
                        <div className="Pixso-symbol-135_148">
                            {button3state === "checked" && (
                                <div className="shadow-blend-unknown-0"></div>
                            )}
                            <div id="135_144" className="Pixso-frame-135_144">
                                {slot_135_145 ?? (
                                    <div
                                        id="135_145"
                                        className="Pixso-vector-135_145"
                                    ></div>
                                )}
                                {slot_135_146 ?? (
                                    <div
                                        id="135_146"
                                        className="Pixso-vector-135_146"
                                    ></div>
                                )}
                            </div>
                        </div>
                        <div className="stroke-135_148"></div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default Button3components;
