import { useMemo, useState, type FormEvent } from "react";
import { companyProfilePage } from "../../config/pages/companyProfile";
import { evaluateFrontendContext } from "../../rules/evaluateFrontendContext";
import { evaluateUiDefinition } from "../../utils/evaluateUiDefinition";
import { evaluatePageCompletion } from "../../utils/pageCompletion";
import { collectDataPaths } from "../../utils/uiNode";
import { RenderNode } from "../request-renderer/RenderNode";

type RequestIntakeProps = {
  userId: string;
  userRole: string;
  pending: boolean;
  error: string | null;
  onCreate: (data: Record<string, any>, dataPaths: string[]) => Promise<void>;
};

export const RequestIntake = ({ userId, userRole, pending, error, onCreate }: RequestIntakeProps) => {
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [validationActive, setValidationActive] = useState(false);
  const page = useMemo(() => evaluateUiDefinition([companyProfilePage], intakeEvaluationContext(draft))[0], [draft]);
  const completion = useMemo(() => evaluatePageCompletion(page, draft), [draft, page]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setValidationActive(true);
    if (!completion.complete) {
      return;
    }
    await onCreate(draft, collectDataPaths(page));
  };

  return (
    <div className="intake-layout">
      <section className="intake-intro" aria-labelledby="intake-title">
        <h2 id="intake-title">Start with the company</h2>
        <p>Capture the minimum information needed to open a request. The full approval workspace appears after the draft is created.</p>
        <ol className="intake-journey" aria-label="Request creation journey">
          <li className="active"><span>1</span><div><strong>Basic profile</strong><small>Identify the company</small></div></li>
          <li><span>2</span><div><strong>Build the request</strong><small>Terms, founders, and indicators</small></div></li>
          <li><span>3</span><div><strong>Select approval levels</strong><small>Analyst and risk choose authority tiers</small></div></li>
        </ol>
        <p className="intake-footnote">A request is created only after this form is complete, preventing empty drafts.</p>
      </section>

      <form className="intake-form" onSubmit={(event) => void submit(event)} noValidate>
        <div className="intake-form-head">
          <div>
            <h3>Company profile</h3>
            <p>Complete every visible required field to create the request.</p>
          </div>
          <span className="draft-chip">New draft</span>
        </div>

        <div className="intake-fields">
          {(page.children ?? []).filter((node) => node.visible).map((node) => (
            <div className={`intake-field intake-field-${node.id}`} key={node.id}>
              <RenderNode
                node={node}
                data={draft}
                setData={setDraft}
                userId={userId}
                userRole={userRole}
                runAction={() => undefined}
                missingPaths={completion.missingPaths}
                validationActive={validationActive}
              />
            </div>
          ))}
        </div>

        {validationActive && !completion.complete ? (
          <div className="intake-guidance" role="alert">Complete the highlighted fields before creating the request.</div>
        ) : null}
        {error ? <div className="notice danger" role="alert">{error}</div> : null}

        <div className="intake-submit-row">
          <p>These details will appear on the Company Profile page.</p>
          <button className="button intake-submit" type="submit" disabled={pending}>
            {pending ? "Creating request..." : "Create request"}
            {!pending ? <ArrowIcon /> : null}
          </button>
        </div>
      </form>
    </div>
  );
};

const intakeEvaluationContext = (requestData: Record<string, any>) => evaluateFrontendContext({
  requestCaseId: "new",
  requestType: "startupInvestment",
  workflowState: "DRAFT",
  user: { userId: "intake", displayName: "Request creator", role: "InvestmentAnalyst", entitlements: ["EDIT_INVESTMENT_REQUEST"] },
  requestData,
  calculations: {},
  definitionVersions: {},
  workflowActions: [],
});

const ArrowIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3 8h9" />
    <path d="m9 4 4 4-4 4" />
  </svg>
);
