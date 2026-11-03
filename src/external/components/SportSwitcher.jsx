import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { sportIconMap } from "../../constant/IconMap";
import { useTranslation } from "../../locale/i18n";

const getSportIcon = (sport) => sportIconMap[String(sport?.code || sport?.id || "").toUpperCase()]?.icon;

function SportSwitcher({ id, sports, selectedSport, onSelect, restoreFocusOnSelect = true }) {
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  const openMenu = (index = sports.findIndex((sport) => sport.id === selectedSport?.id)) => {
    if (!sports.length) return;
    setActiveIndex(Math.max(0, index));
    setOpen(true);
  };

  const handleTriggerKeyDown = (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const selectedIndex = sports.findIndex((sport) => sport.id === selectedSport?.id);
    openMenu(event.key === "ArrowUp" ? Math.max(0, selectedIndex - 1) : Math.min(sports.length - 1, selectedIndex + 1));
  };

  const handleMenuKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (event.key === "Tab") {
      setOpen(false);
      return;
    }
    const nextIndex = {
      ArrowDown: Math.min(activeIndex + 1, sports.length - 1),
      ArrowUp: Math.max(activeIndex - 1, 0),
      Home: 0,
      End: sports.length - 1,
    }[event.key];
    if (nextIndex === undefined) return;
    event.preventDefault();
    setActiveIndex(nextIndex);
  };

  const chooseSport = (sport) => {
    onSelect(sport);
    setOpen(false);
    if (restoreFocusOnSelect) triggerRef.current?.focus();
  };

  return (
    <div className="navbar-sport-switch">
      <div className="navbar-sport-select-wrap" ref={rootRef}>
        <button
          id={id}
          ref={triggerRef}
          type="button"
          className={`navbar-sport-trigger${open ? " is-open" : ""}`}
          aria-label={`${t("球類")}：${selectedSport?.name || t("載入中")}`}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={`${id}-menu`}
          disabled={!sports.length}
          onClick={() => open ? setOpen(false) : openMenu()}
          onKeyDown={handleTriggerKeyDown}
        >
          <span className="navbar-sport-trigger-icon" aria-hidden="true">{getSportIcon(selectedSport)}</span>
          <span className="navbar-sport-trigger-name">{selectedSport?.name || t("載入中")}</span>
          <ChevronDown className="navbar-sport-chevron" size={16} aria-hidden="true" />
        </button>
        {open && (
          <div id={`${id}-menu`} className="navbar-sport-options" role="menu" aria-label={t("球類")} onKeyDown={handleMenuKeyDown}>
            {sports.map((sport, index) => {
              const selected = sport.id === selectedSport?.id;
              return (
                <button
                  key={sport.id}
                  ref={(element) => { optionRefs.current[index] = element; }}
                  type="button"
                  className={`navbar-sport-option${selected ? " is-selected" : ""}`}
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => chooseSport(sport)}
                >
                  <span className="navbar-sport-option-icon" aria-hidden="true">{getSportIcon(sport)}</span>
                  <span>{sport.name}</span>
                  {selected && <Check className="navbar-sport-check" size={16} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default SportSwitcher;
