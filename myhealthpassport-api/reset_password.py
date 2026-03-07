import logging
import typer
from tortoise import Tortoise, run_async
from typer import Option, colors, style
from typing import Optional

# Assuming these imports are correct based on your project structure
from src.config import TORTOISE_ORM
from src.core.password_manager import create_password_hash
from src.models.user_models import (
    AdminTeam, AdminTeamRoles,
    ScreeningTeam, ScreeningTeamRoles,
    OnGroundTeam, OnGroundTeamRoles,
    AnalystTeam, AnalystRoles,
    ConsultantTeam,
    SchoolStaff
)
from src.utils.constants import TeamType


logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Initialize the main Typer application
app = typer.Typer() # Renamed cli_app to app for clarity, though cli_app works too

@app.command("reset-password") # Register the command with the 'app' instance
def reset_password_cli(
    role_type: TeamType = Option(..., help="The type of team (e.g., ADMIN_TEAM, SCREENING_TEAM)."),
    username: str = Option(..., help="The username of the account to reset."),
    new_password: str = Option(..., prompt=True, hide_input=True, confirmation_prompt=True, help="The new password for the account."),
):
    """
    Resets the password for a specified user account in a given team type.
    """
    async def _reset():

        await Tortoise.init(config=TORTOISE_ORM)
        logger.info("Database connection initialized for password reset.")

        typer.echo(f"Attempting to reset password for username: {username} in team type: {role_type.value}...")

        model_map = {
            TeamType.ADMIN_TEAM: AdminTeam,
            TeamType.SCREENING_TEAM: ScreeningTeam,
            TeamType.ON_GROUND_TEAM: OnGroundTeam,
            TeamType.ANALYST_TEAM: AnalystTeam,
            TeamType.CONSULTANT_TEAM: ConsultantTeam,
            TeamType.SCHOOL_STAFF: SchoolStaff
        }

        TargetModel = model_map.get(role_type)

        if not TargetModel:
            typer.echo(style(f"Error: Invalid team type '{role_type.value}'.", fg=colors.RED))
            raise typer.Exit(code=1)

        user = await TargetModel.get_or_none(username=username)

        if not user:
            typer.echo(style(f"Error: User with username '{username}' not found in '{role_type.value}' team.", fg=colors.RED))
            raise typer.Exit(code=1)

        hashed_password = create_password_hash(new_password)
        user.password = hashed_password
        await user.save()

        typer.echo(style(f"✅ Password for user '{username}' ({role_type.value} team) has been successfully reset!", fg=colors.GREEN))


    run_async(_reset())


if __name__ == "__main__":
    app() # Call the 'app' instance here
    # python3 reset_password.py --role-type ADMIN_TEAM  --username vrinda
