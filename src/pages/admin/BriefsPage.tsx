import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { PageHeader, Section } from '@/components/PageHeader';
import { BriefStatusBadge } from '@/components/StatusBadge';
import { EmptyRow, TD, TH, THead, TR, Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

export function BriefsPage() {
  const briefs = useStore((s) => s.briefs);
  const navigate = useNavigate();

  return (
    <Section>
      <PageHeader
        index="Admin"
        title="Briefs"
        description="Every customer enquiry with its extracted specification, chat transcript and match result."
        actions={
          <Button variant="outline" asChild>
            <Link to="/admin/sourcing">Sourcing queue</Link>
          </Button>
        }
      />

      <div className="mt-8">
        <Table>
          <THead>
            <TR>
              <TH>Brief</TH>
              <TH>Created</TH>
              <TH>Customer</TH>
              <TH>Specification</TH>
              <TH>Source</TH>
              <TH>Matches</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <tbody>
            {briefs.length === 0 && <EmptyRow colSpan={7}>No briefs yet.</EmptyRow>}
            {briefs.map((brief) => (
              <TR
                key={brief.id}
                className="cursor-pointer transition-colors hover:bg-surface"
                onClick={() => navigate(`/admin/briefs/${brief.id}`)}
              >
                <TD className="num">{brief.id}</TD>
                <TD className="num text-muted">{formatDate(brief.createdAt)}</TD>
                <TD>
                  <span className="block font-medium">{brief.company}</span>
                  <span className="text-[11px] text-muted">{brief.customerName}</span>
                </TD>
                <TD>
                  {brief.category ?? '—'} / {brief.subCategory ?? '—'}
                  <span className="num block text-[11px] text-muted">
                    {brief.volumeMl ? `${brief.volumeMl} ml` : '— ml'}
                    {brief.quantity ? ` · ${brief.quantity} pcs` : ''}
                  </span>
                </TD>
                <TD className="uppercase text-muted">{brief.inputMethod}</TD>
                <TD className="num">{brief.matchIds.length}</TD>
                <TD>
                  <BriefStatusBadge status={brief.status} />
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </div>
    </Section>
  );
}
