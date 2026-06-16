import Link from "next/link";
import type { Company } from "@/generated/prisma/client";

type CompanyWithCount = Company & {
  _count: { listings: number };
};

type CompanyCardProps = {
  company: CompanyWithCount;
};

export function CompanyCard({ company }: CompanyCardProps) {
  const location = [company.city, company.state, company.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{company.name}</h3>
          {location ? <p className="text-sm text-slate-500">{location}</p> : null}
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
          {company._count.listings} listings
        </span>
      </div>

      {company.description ? (
        <p className="mb-4 line-clamp-3 text-sm leading-6 text-slate-600">
          {company.description}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href={`/search?manufacturer=${encodeURIComponent(company.name)}`}
          className="font-medium text-blue-600 hover:text-blue-700"
        >
          View inventory
        </Link>
        {company.website ? (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-slate-700"
          >
            Website
          </a>
        ) : null}
      </div>
    </div>
  );
}
