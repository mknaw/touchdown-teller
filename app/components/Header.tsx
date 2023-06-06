import { TeamKey } from 'app/types';
import { getTeamName } from 'app/utils';

export default function Header({ team }: { team: TeamKey }) {
    return (
        <h1 className="w-full flex justify-center text-2xl p-4">
            {getTeamName(team)}
        </h1>
    );
}
