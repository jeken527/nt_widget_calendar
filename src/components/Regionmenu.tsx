import Button1components from "@/components/Button1components";
import { useState } from "react";
import { withStopPropagation } from "@/utils/utils";
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
        slot_97_144,
        slot_97_159,
        slot_97_161,
        slot_97_162,
        slot_97_163
    } = props;

    // 내부 상태는 사용하지 않도록 전부 제거하여 가볍게 만듭니다.
    // 클릭과 호버 로직은 모두 Frame72327(부모)에서 제어합니다!

    return (
        <div className={`component-97_172 ${className}`} id={id} style={{ position: 'relative', width: '78px', height: '25px' }}>
            
            {/* 1. 항상 보이는 메인 REGION 버튼 (높이 25px로 영구 고정) */}
            <div id="97_171" className="Pixso-symbol-97_171" style={{ width: '100%', height: '100%' }}>
                {regionmenu === "False" ? slot_97_159 : slot_97_144}
            </div>

            {/* 2. 클릭했을 때만 둥둥 떠오르는 드롭다운 메뉴 목록 */}
            {regionmenu === "True" && (
                <div 
                    id="97_170" 
                    className="Pixso-symbol-97_170" 
                    style={{ 
                        position: 'absolute', 
                        top: '25px', 
                        left: '0px', 
                        zIndex: 99999,
                        backgroundColor: 'transparent'
                    }}
                >
                    <div id="97_160" className="stroke-wrapper-97_160">
                        <div className="Pixso-frame-97_160">
                            <div className="shadow-blend-unknown-0"></div>
                            <div className="frame-content-97_160">
                                {slot_97_161}
                                {slot_97_162}
                                {slot_97_163}
                            </div>
                        </div>
                        <div className="stroke-97_160"></div>
                    </div>
                </div>
            )}
            
        </div>
    );
};
export default Regionmenu;
