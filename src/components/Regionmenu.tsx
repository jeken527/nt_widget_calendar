import Button1components from "@/components/Button1components";
import { useState } from "react";
import { withStopPropagation } from "@/utils/utils";
import { motion, AnimatePresence } from "motion/react";
import Button2components from "@/components/Button2components";
import "@/styles/Regionmenu.css";

interface RegionmenuProps {
    regionmenu?: string;
    id?: string;
    className?: string;
    click?: (e: any) => void;
    transitionConfig?: any;
    slot_97_144?: React.ReactNode;
    slot_97_159?: React.ReactNode;
    slot_97_161?: React.ReactNode;
    slot_97_162?: React.ReactNode;
    slot_97_163?: React.ReactNode;
}

const Regionmenu = (props: RegionmenuProps) => {
    const {
        regionmenu,
        id,
        className = "",
        click,
        transitionConfig,
        slot_97_144,
        slot_97_159,
        slot_97_161,
        slot_97_162,
        slot_97_163
    } = props;

    const [button1state_97_144, setButton1state_97_144] = useState("default");
    const [transitionConfig97_144, setTransitionConfig97_144] = useState({});
    const [button2state_97_161, setButton2state_97_161] = useState("default");
    const [transitionConfig97_161, setTransitionConfig97_161] = useState({});
    const [button2state_97_162, setButton2state_97_162] = useState("default");
    const [transitionConfig97_162, setTransitionConfig97_162] = useState({});
    const [button2state_97_163, setButton2state_97_163] = useState("default");
    const [transitionConfig97_163, setTransitionConfig97_163] = useState({});

    // 👇 에러가 나던 이 부분의 변수 이름을 localTransitionConfig로 변경했습니다.
    const localTransitionConfig: any = {
        "97:163_77:125_mo": {
            transition: { duration: 0, ease: [0.215, 0.61, 0.355, 1] }
        }
    };

    const mouseover_97_144 = () => {
        setButton1state_97_144("checked");
    };

    const mouseover_97_161 = () => {
        setButton2state_97_161("checked");
    };

    const mouseover_97_162 = () => {
        setButton2state_97_162("checked");
    };

    const mouseover_97_163 = () => {
        setButton2state_97_163("checked");
    };

    return (
        <div
            className={`component-97_172 ${className}`}
            id={id}
            onClick={withStopPropagation(click)}
        >
            <div id="97_172" className="Pixso-symbol-97_172">
                <AnimatePresence initial={false}>
                    {regionmenu === "False" && (
                        <motion.div
                            id="97_171"
                            className="Pixso-symbol-97_171"
                            key={"97:171"}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={
                                transitionConfig && transitionConfig.transition
                            }
                        >
                            {slot_97_144 ?? (
                                <Button1components
                                    id="97_144"
                                    className="Pixso-instance-97_144"
                                    button1state={button1state_97_144}
                                    transitionConfig={transitionConfig97_144}
                                    mouseover={mouseover_97_144}
                                ></Button1components>
                            )}
                        </motion.div>
                    )}
                    {regionmenu === "True" && (
                        <motion.div
                            id="97_170"
                            className="Pixso-symbol-97_170"
                            key={"97:170"}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={
                                transitionConfig && transitionConfig.transition
                            }
                        >
                            {slot_97_159 ?? (
                                <Button1components
                                    id="97_159"
                                    className="Pixso-instance-97_159"
                                    button1state="checked"
                                ></Button1components>
                            )}
                            <div id="97_160" className="stroke-wrapper-97_160">
                                <div className="Pixso-frame-97_160">
                                    <div className="shadow-blend-unknown-0"></div>
                                    <div className="frame-content-97_160">
                                        {slot_97_161 ?? (
                                            <Button2components
                                                id="97_161"
                                                className="Pixso-instance-97_161"
                                                button2state={
                                                    button2state_97_161
                                                }
                                                transitionConfig={
                                                    transitionConfig97_161
                                                }
                                                mouseover={mouseover_97_161}
                                            ></Button2components>
                                        )}
                                        {slot_97_162 ?? (
                                            <Button2components
                                                id="97_162"
                                                className="Pixso-instance-97_162"
                                                button2state={
                                                    button2state_97_162
                                                }
                                                transitionConfig={
                                                    transitionConfig97_162
                                                }
                                                mouseover={mouseover_97_162}
                                                slot_77_120={
                                                    <p
                                                        id="77_120"
                                                        className="Pixso-paragraph-77_120"
                                                    >
                                                        {"JAPAN"}
                                                    </p>
                                                }
                                            ></Button2components>
                                        )}
                                        {slot_97_163 ?? (
                                            <Button2components
                                                id="97_163"
                                                className="Pixso-instance-97_163"
                                                button2state={
                                                    button2state_97_163
                                                }
                                                transitionConfig={
                                                    transitionConfig97_163
                                                }
                                                mouseover={mouseover_97_163}
                                                slot_77_120={
                                                    <p
                                                        id="77_120"
                                                        className="Pixso-paragraph-77_120"
                                                    >
                                                        {"AMERICA"}
                                                    </p>
                                                }
                                            ></Button2components>
                                        )}
                                    </div>
                                </div>
                                <div className="stroke-97_160"></div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Regionmenu;
