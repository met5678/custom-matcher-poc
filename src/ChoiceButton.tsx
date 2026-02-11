import { Choice } from "./types/types";

export const ChoiceButton = ({ choice }: { choice: Choice }) => {
  return (
    <button className="choice-button">
      <div className="choice-button-content">
        <div className="choice-button-content-name">{choice.name}</div>
      </div>
    </button>
  );
};
